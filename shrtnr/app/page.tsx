"use client"
import { CssVarsProvider, extendTheme } from '@mui/joy/styles'
import Grid from '@mui/joy/Grid'
import LinkShortenerInput from "@/components/Search"

export default function Home() {

	const theme = extendTheme({
		components: {
			JoyAutocomplete: {
				styleOverrides: {
					listbox: {
						paddingTop: 0,
						paddingBottom: 0
					}
				}
			}
		}
	})

	return (
		<CssVarsProvider theme={theme}>
			<Grid component={"main"} maxWidth={"100%"} display={"flex"} flexGrow={"1"} justifyContent={"center"}>
				<LinkShortenerInput />
			</Grid>
		</CssVarsProvider>
	)
}
