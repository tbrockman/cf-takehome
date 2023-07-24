import Grid from "@mui/joy/Grid/Grid";
import Table from '@mui/joy/Table';
import Typography from "@mui/joy/Typography";
import Link from "@mui/joy/Link";
import Card from "@mui/joy/Card"

export type ShortLink = {
    short: string,
    long: string,
    timeseries: any[]
}

export type ShortLinkManagerProps = {
    link: ShortLink
}

export default function ShortLinkManager({ link }: ShortLinkManagerProps) {

    return (
        <Card variant='outlined' style={{boxShadow: 'none'}}>
            <Table variant="plain" borderAxis="none">
                <thead>
                    <tr>
                        <th style={{width: '40%'}}>Link</th>
                        <th>Last day</th>
                        <th>Last week</th>
                        <th>All time</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><Link href={link.short}>{link.short}</Link></td>
                        <td>2 views</td>
                        <td>5 views</td>
                        <td>69 views</td>
                    </tr>
                </tbody>
            </Table>
        </Card>
    );
}