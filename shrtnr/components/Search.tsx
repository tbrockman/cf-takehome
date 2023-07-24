import Autocomplete, { createFilterOptions } from "@mui/joy/Autocomplete";
import AutocompleteOption from '@mui/joy/AutocompleteOption';
import FormLabel from "@mui/joy/FormLabel";
import FormControl from "@mui/joy/FormControl";
import React from "react";
import Grid from "@mui/joy/Grid/Grid";
import ShortLinkManager, { ShortLink } from "./ShortLinkManager";

export default function LinkShortenerInput() {

    const [link, setLink] = React.useState<ShortLink>();
    const options = [
        {
            "short": "https://shrtnr.com/abc123",
            "long": "https://www.google.com/search?q=abc123",
            "timeseries": [],
        },
        {
            "short": "https://shrtnr.com/def456",
            "long": "https://theo.lol",
            "timeseries": [],
        },
        {
            "short": "https://shrtnr.com/ghi789",
            "long": "https://www.google.com/search?q=ghi789",
            "timeseries": [],
        }
    ]

    return (
      <Grid container marginTop={'40vh'} spacing={1} flexDirection={'column'} maxWidth={'600px'}>
        <Grid>
            <FormControl id="find-or-shorten-form">
            <FormLabel style={{fontSize: '28px'}}>🔍 Find or 🩳 shorten a 🔗 URL</FormLabel>
            <Autocomplete 
                value={link?.long}
                onChange={(event, newValue) => {
                    if (typeof newValue === 'string') {
                    }
                    else if (typeof newValue === 'object' && newValue != null) {
                        setLink(newValue)
                    }
                }}
                isOptionEqualToValue={(option, value) => option.long === value.long}
                options={options}
                freeSolo
                selectOnFocus
                clearOnBlur
                handleHomeEndKeys
                renderOption={(props, option) => {

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
                sx={{ width: 600, borderRadius: '12px' }}
                getOptionLabel={(option) =>
                    typeof option === 'string' ? option : option.long
                }
                filterOptions={(options, params) => {

                    if (params.inputValue !== '') {
                        options.push({
                            short: '',
                            timeseries: [],
                            long: `Shorten "${params.inputValue}"`,
                        });
                    }
                    return options;
                }}
            />
            </FormControl>
        </Grid>
        <Grid>
            {link && <ShortLinkManager link={link} />}
        </Grid>
      </Grid>
    );
}