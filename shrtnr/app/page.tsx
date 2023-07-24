"use client"

import Grid from '@mui/joy/Grid'
import LinkShortenerInput from "@/components/Search"

export default function Home() {

	return (
		<Grid component={"main"} display={"flex"} flexGrow={"1"} justifyContent={"center"}>
			<LinkShortenerInput />
		</Grid>
	)
}
