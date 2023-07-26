import Autocomplete from "@mui/joy/Autocomplete"
import AutocompleteOption from '@mui/joy/AutocompleteOption'
import FormLabel from "@mui/joy/FormLabel"
import FormControl from "@mui/joy/FormControl"
import React from "react"
import Grid from "@mui/joy/Grid/Grid"
import ShortLinkManager from "./ShortLinkManager"
import { URLWithoutProtocol } from "@/lib/urls"
import { PartialShortLink, ShortLink } from "@/lib/models/short-link"




export default function LinkShortenerInput() {

    const [creating, setCreating] = React.useState<boolean>(false)
    const [link, setLink] = React.useState<PartialShortLink | null>(null)
    const options: PartialShortLink[] = [
        {
            "short": new URLWithoutProtocol("https://shrtnr.com/abc123"),
            "long": new URLWithoutProtocol("https://www.google.com/search?q=abc123"),
            "views": {
                today: 0,
                week: 0,
                all: 0
            }
        },
        {
            "short": new URLWithoutProtocol("https://shrtnr.com/def456"),
            "long": new URLWithoutProtocol("https://theo.lol"),
            "views": {
                today: 0,
                week: 0,
                all: 0
            }
        },
        {
            "short": new URLWithoutProtocol("https://shrtnr.com/ghi789"),
            "long": new URLWithoutProtocol("https://www.google.com/search?q=ghi789"),
            "views": {
                today: 0,
                week: 0,
                all: 0
            }
        }
    ]

    const createLink = (url: string) => {
        setCreating(true)
        fetch('/api/links', {
            method: 'POST',
            body: JSON.stringify({ url })
        })
            .then(response => response.json())
            .then((data: ShortLink) => {
                console.log(data)
                data.short = new URLWithoutProtocol(data.short)
                data.long = new URLWithoutProtocol(data.long)
                setLink(data)
                setCreating(false)
            })
    }

    return (
        <Grid container marginTop={'30vh'} spacing={1} flexDirection={'column'} maxWidth={'600px'}>
            <Grid maxWidth='100%'>
                <FormControl id="find-or-shorten-form">
                    <FormLabel style={{ fontSize: '28px', marginBottom: '7px' }}>🔍 Find or 🩳 shorten a 🔗 link</FormLabel>
                    <Autocomplete
                        placeholder={'https://xyz.abc/123'}
                        value={link?.long.toString()}
                        onChange={(event, newValue, reason) => {
                            console.log('being changed', event, newValue, reason)
                            // if (typeof newValue === 'string' && newValue.length > 0 && event.type === 'keydown') {
                            //     createLink(newValue)
                            // }

                            if (reason === 'selectOption' && newValue) {
                                // It will be an object if it's an option which was returned by search
                                if (typeof newValue === 'object') {

                                    if (newValue.short) {
                                        setLink(newValue)
                                    }
                                    else {
                                        createLink(newValue.long.toString())
                                    }
                                }
                                // Otherwise, it's a string
                                else {
                                    createLink(newValue)
                                }
                            }
                            else if (reason === 'clear') {
                                setLink(null)
                            }
                            else if (reason === 'createOption' && typeof newValue === 'string') {
                                createLink(newValue)
                            }
                        }}
                        style={{ padding: '0 24px' }}
                        isOptionEqualToValue={(option, value) => option?.long === value?.long}
                        options={options}
                        freeSolo
                        selectOnFocus
                        handleHomeEndKeys
                        autoFocus
                        clearOnEscape
                        renderOption={(props, option) => {
                            const style = {
                                ...props.style,
                                paddingLeft: '23px',
                                paddingRight: '23px'
                            }
                            props.style = style

                            if (option.short) {
                                return (
                                    <AutocompleteOption {...props}>
                                        <Grid display={"flex"} container flexDirection={"row"} width={"100%"}>
                                            <Grid xs={7}>{option.long.toString()}</Grid>
                                            <Grid xs={1} textAlign={'right'}>🩳</Grid>
                                            <Grid xs={4} textAlign={'right'}>{option.short.toString()}</Grid>
                                        </Grid>
                                    </AutocompleteOption>
                                )
                            }
                            else {
                                return (
                                    <AutocompleteOption {...props}>
                                        <Grid display={"flex"} container flexDirection={"row"} width={"100%"}>
                                            <Grid>{option.text}</Grid>
                                            <Grid>&nbsp;👖✂️</Grid>
                                        </Grid>
                                    </AutocompleteOption>
                                )
                            }
                        }}
                        sx={{ width: 600, maxWidth: '100%', borderRadius: '12px' }}
                        getOptionLabel={(option) =>
                            typeof option === 'string' ? option : option.long.toString()
                        }
                        filterOptions={(options, params) => {

                            if (params.inputValue !== '') {
                                options.push({
                                    short: null,
                                    long: params.inputValue,
                                    text: `Shorten "${params.inputValue}"`,
                                    views: {
                                        today: 0,
                                        week: 0,
                                        all: 0
                                    }
                                })
                            }
                            return options
                        }}
                    />
                </FormControl>
            </Grid>
            <Grid>
                {link && <ShortLinkManager link={link as ShortLink} setLink={setLink} />}
            </Grid>
        </Grid>
    )
}