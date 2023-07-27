import Box from "@mui/joy/Box"
import Divider from "@mui/joy/Divider"
import Grid from "@mui/joy/Grid/Grid"
import Table from '@mui/joy/Table'
import Link from "@mui/joy/Link"
import Card from "@mui/joy/Card"
import Button from "@mui/joy/Button"
import Modal from '@mui/joy/Modal'
import ModalDialog from '@mui/joy/ModalDialog'
import IconButton from "@mui/joy/IconButton"
import Typography from "@mui/joy/Typography"
import WarningRoundedIcon from '@mui/icons-material/WarningRounded'
import DeleteForever from '@mui/icons-material/DeleteForever'
import IosShareIcon from '@mui/icons-material/IosShare'
import { useState } from "react"
import { ShortLink } from "@/lib/models/short-link"





export type ShortLinkManagerProps = {
    link: ShortLink,
    setLink: (link: ShortLink | null) => void
    setInputValue: (value: string) => void
}

export default function ShortLinkManager({ link, setLink, setInputValue }: ShortLinkManagerProps) {

    const [open, setOpen] = useState<boolean>(false)
    const [isDeleting, setDeleting] = useState<boolean>(false)

    const openDeleteDialog = () => {
        setOpen(true)
    }

    const getLink = () => {

    }

    const shareLink = () => {
        navigator.share({ url: URL.prototype.toString.apply(link.short) })
    }

    const deleteLink = () => {
        setDeleting(true)
        fetch(`/api/links${link.short.pathname}`, { method: 'DELETE' }).then(response => {
            if (response.ok) {
                setDeleting(false)
            }
            setLink(null)
            setInputValue('')
            setOpen(false)
        })
    }

    return (
        <>
            <Modal open={open} onClose={() => setOpen(false)}>
                <ModalDialog
                    variant="outlined"
                    role="alertdialog"
                    aria-labelledby="alert-dialog-modal-title"
                    aria-describedby="alert-dialog-modal-description">
                    <Typography
                        id="alert-dialog-modal-title"
                        component="h2"
                        startDecorator={<WarningRoundedIcon />}
                    >
                        Confirm
                    </Typography>
                    <Divider />
                    <Typography id="alert-dialog-modal-description" textColor="text.tertiary">
                        Are you sure you want to permanently remove this link?
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 2 }}>
                        <Button variant="plain" color="neutral" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button loading={isDeleting} variant="solid" color="danger" onClick={deleteLink}>
                            Delete
                        </Button>
                    </Box>
                </ModalDialog>
            </Modal>
            <Card variant='outlined' style={{ boxShadow: 'none' }}>
                {/* @ts-ignore */}
                <Table variant="plain" borderAxis="none" style={{ '--unstable_TableCell-height': 'none' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '40%' }}>Link 🩳</th>
                            <th>Last day</th>
                            <th>Last week</th>
                            <th>All time</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><Link href={URL.prototype.toString.apply(link.short)}>{link.short.toString()}</Link></td>
                            <td>{link.views.today} views</td>
                            <td>{link.views.week} views</td>
                            <td>{link.views.all} views</td>
                        </tr>
                    </tbody>
                </Table>
                <Grid container flexDirection={'row'} spacing={1} padding={'0 0.5rem'} paddingTop='1rem'>
                    <Grid>
                        <Button color='primary' variant='solid' startDecorator={<IosShareIcon />} onClick={shareLink}>
                            Share
                        </Button>
                    </Grid>
                    <Grid>
                        <Button color='danger' variant='outlined' startDecorator={<DeleteForever />} onClick={openDeleteDialog}>
                            Delete
                        </Button>
                    </Grid>
                </Grid>
            </Card>
        </>
    )

}