import Autocomplete from "@mui/joy/Autocomplete"
import AutocompleteOption from '@mui/joy/AutocompleteOption'
import FormLabel from "@mui/joy/FormLabel"
import FormControl from "@mui/joy/FormControl"
import React from "react"
import Grid from "@mui/joy/Grid/Grid"
import ShortLinkManager, { ShortLink } from "./ShortLinkManager"

export default function LinkShortenerInput() {

    const [link, setLink] = React.useState<ShortLink | null>()
    const options = [
        {
            "short": "https://shrtnr.com/abc123",
            "long": "https://www.google.com/search?q=abc123"
        },
        {
            "short": "https://shrtnr.com/def456",
            "long": "https://theo.lol"
        },
        {
            "short": "https://shrtnr.com/ghi789",
            "long": "https://www.google.com/search?q=ghi789"
        }
    ]

    return (
        <Grid container marginTop={'30vh'} spacing={1} flexDirection={'column'} maxWidth={'600px'}>
            <Grid maxWidth='100%'>
                <FormControl id="find-or-shorten-form">
                    <FormLabel style={{ fontSize: '28px', marginBottom: '7px' }}>🔍 Find or 🩳 shorten a 🔗 link</FormLabel>
                    <Autocomplete
                        value={link?.long}
                        onChange={(event, newValue) => {
                            console.log('being changed', event, newValue)
                            if (typeof newValue === 'string') {
                                console.log('its a strin gbaby')
                            }
                            else if (typeof newValue === 'object') {
                                setLink(newValue)
                            }
                        }}
                        style={{ padding: '0 24px' }}
                        isOptionEqualToValue={(option, value) => option.long === value.long}
                        options={options}
                        freeSolo
                        selectOnFocus
                        handleHomeEndKeys
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
                                            <Grid xs={7}>{option.long}</Grid>
                                            <Grid xs={1} textAlign={'right'}>🩳</Grid>
                                            <Grid xs={4} textAlign={'right'}>{option.short}</Grid>
                                        </Grid>
                                    </AutocompleteOption>
                                )
                            }
                            else {
                                return (
                                    <AutocompleteOption {...props}>
                                        <Grid display={"flex"} container flexDirection={"row"} width={"100%"}>
                                            <Grid>{option.long}</Grid>
                                            <Grid>&nbsp;👖✂️</Grid>
                                        </Grid>
                                    </AutocompleteOption>
                                )
                            }
                        }}
                        sx={{ width: 600, maxWidth: '100%', borderRadius: '12px' }}
                        getOptionLabel={(option) =>
                            typeof option === 'string' ? option : option.long
                        }
                        filterOptions={(options, params) => {

                            if (params.inputValue !== '') {
                                options.push({
                                    short: '',
                                    long: `Shorten "${params.inputValue}"`,
                                })
                            }
                            return options
                        }}
                    />
                </FormControl>
            </Grid>
            <Grid>
                {link && <ShortLinkManager link={link} />}
            </Grid>
        </Grid>
    )
}