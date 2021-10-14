import React from 'react'

import { executeReactStateUITask } from 'src/util/ui-logic'
import ShareAnnotationMenu from './components/ShareAnnotationMenu'
import { runInBackground } from 'src/util/webextensionRPC'
import type { ShareMenuCommonProps, ShareMenuCommonState } from './types'
import { getKeyName } from 'src/util/os-specific-key-names'

interface State extends ShareMenuCommonState {
    showLink: boolean
}

export interface Props extends ShareMenuCommonProps {
    isShared?: boolean
    annotationUrl: string
    shareImmediately?: boolean
}

export default class SingleNoteShareMenu extends React.PureComponent<
    Props,
    State
> {
    static MOD_KEY = getKeyName({ key: 'mod' })
    static ALT_KEY = getKeyName({ key: 'alt' })
    static defaultProps: Pick<Props, 'contentSharingBG' | 'annotationsBG'> = {
        contentSharingBG: runInBackground(),
        annotationsBG: runInBackground(),
    }

    state: State = {
        link: '',
        showLink: false,
        loadState: 'pristine',
        shareState: 'pristine',
    }

    async componentDidMount() {
        const linkExists = await this.setRemoteLinkIfExists()
        if (!linkExists && this.props.shareImmediately) {
            await executeReactStateUITask<State, 'loadState'>(
                this,
                'loadState',
                async () => {
                    await this.shareAnnotation()
                },
            )
        }
    }

    private handleLinkCopy = () => this.props.copyLink(this.state.link)

    private setRemoteLinkIfExists = async (): Promise<boolean> => {
        const { annotationUrl, contentSharingBG } = this.props
        const link = await contentSharingBG.getRemoteAnnotationLink({
            annotationUrl,
        })
        if (!link) {
            return false
        }
        this.setState({ link, showLink: true })
        await this.handleLinkCopy()
        return true
    }

    private async handleAnnotationProtection(shouldProtect: boolean) {
        const { annotationUrl, annotationsBG } = this.props
        if (shouldProtect) {
            await annotationsBG.protectAnnotation({ annotation: annotationUrl })
        } else {
            await annotationsBG.dropAnnotationProtection({
                annotation: annotationUrl,
            })
        }
    }

    private shareAnnotation = async (shouldProtect?: boolean) => {
        const { annotationUrl, contentSharingBG } = this.props
        await contentSharingBG.shareAnnotation({
            annotationUrl,
            shareToLists: true,
        })
        await this.setRemoteLinkIfExists()
        if (shouldProtect != null) {
            await this.handleAnnotationProtection(shouldProtect)
        }

        this.props.postShareHook?.({
            isShared: true,
            isProtected: shouldProtect,
        })
    }

    private unshareAnnotation = async (shouldProtect?: boolean) => {
        const { annotationUrl, contentSharingBG } = this.props
        await contentSharingBG.unshareAnnotation({ annotationUrl })
        this.setState({ showLink: false })
        await this.handleAnnotationProtection(shouldProtect)

        this.props.postShareHook?.({
            isShared: false,
            isProtected: shouldProtect,
        })
    }

    private handleSetShared = async (shouldProtect?: boolean) => {
        const p = executeReactStateUITask<State, 'shareState'>(
            this,
            'shareState',
            async () => {
                await this.shareAnnotation(shouldProtect)
            },
        )

        this.props.closeShareMenu({} as any)
        await p
    }

    private handleSetPrivate = async (shouldProtect?: boolean) => {
        const p = executeReactStateUITask<State, 'shareState'>(
            this,
            'shareState',
            async () => {
                await this.unshareAnnotation(shouldProtect)
            },
        )

        this.props.closeShareMenu({} as any)
        await p
    }

    render() {
        return (
            <ShareAnnotationMenu
                link={this.state.link}
                showLink={this.state.showLink}
                onCopyLinkClick={this.handleLinkCopy}
                onClickOutside={this.props.closeShareMenu}
                linkTitleCopy="Link to this note"
                privacyOptionsTitleCopy="Set privacy for this note"
                isLoading={
                    this.state.shareState === 'running' ||
                    this.state.loadState === 'running'
                }
                privacyOptions={[
                    {
                        icon: 'shared',
                        title: 'Shared',
                        hasProtectedOption: true,
                        onClick: this.handleSetShared,
                        isSelected: this.props.isShared,
                        shortcut: `shift+${SingleNoteShareMenu.ALT_KEY}+enter`,
                        description:
                            'Added to shared collections the page is in',
                    },
                    {
                        icon: 'person',
                        title: 'Private',
                        hasProtectedOption: true,
                        onClick: this.handleSetPrivate,
                        isSelected: !this.props.isShared,
                        shortcut: `${SingleNoteShareMenu.MOD_KEY}+enter`,
                        description: 'Private to you, until shared (in bulk)',
                    },
                ]}
                shortcutHandlerDict={{
                    // 'mod+shift+enter': this.handleSetProtected,
                    'alt+shift+enter': this.handleSetShared,
                    'mod+enter': this.handleSetPrivate,
                }}
            />
        )
    }
}
