import React from 'react'
import styled, { css, keyframes } from 'styled-components'
import Logic, { Dependencies, State, Event } from './logic'

import { fonts } from 'src/dashboard-refactor/styles'
import colors from 'src/dashboard-refactor/colors'
import { Icon } from 'src/dashboard-refactor/styled-components'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'

import Margin from 'src/dashboard-refactor/components/Margin'
import * as icons from 'src/common-ui/components/design-library/icons'
import { sharedListRoleIDToString } from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal/util'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { ButtonTooltip } from 'src/common-ui/components'
import { copyToClipboard } from 'src/annotations/content_script/utils'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'

import { StatefulUIElement } from 'src/util/ui-logic'
import EditableMenuItem, {
    Props as EditableMenuItemProps,
} from 'src/dashboard-refactor/lists-sidebar/components/editable-menu-item'

export interface Props extends Dependencies {
    xPosition?: number
    yPosition?: number
    fixedPositioning?: boolean
    editableProps: Omit<EditableMenuItemProps, 'nameValue' | 'onNameChange'>
    onDeleteSpaceConfirm?: React.MouseEventHandler
    onClose: (saveChanges?: boolean) => void
}

export default class SpaceContextMenuContainer extends StatefulUIElement<
    Props,
    State,
    Event
> {
    static defaultProps: Pick<Props, 'copyToClipboard'> = {
        copyToClipboard,
    }

    private containerElRef = React.createRef<HTMLDivElement>()

    constructor(props: Props) {
        super(props, new Logic(props))
    }

    getContainerRect(): DOMRect | null {
        return this.containerElRef?.current?.getBoundingClientRect() ?? null
    }

    private closeModal: React.MouseEventHandler = (e) => {
        e.stopPropagation()
        this.props.onClose(true)
    }

    private renderShareLinks() {
        if (!this.state.inviteLinks.length) {
            return (
                <ShareSectionContainer onClick={(e) => e.stopPropagation()}>
                    <PrimaryAction
                        label={
                            <ButtonLabel>
                                {' '}
                                <Icon
                                    color="white"
                                    heightAndWidth="12px"
                                    path={icons.link}
                                    hoverOff
                                />{' '}
                                Share this Space
                            </ButtonLabel>
                        }
                        onClick={async (e) => {
                            e.stopPropagation()
                            await this.processEvent('addLinks', null)
                        }}
                    />
                </ShareSectionContainer>
            )
        }

        return (
            <ShareSectionContainer
                onClick={(e) => {
                    e.stopPropagation()
                }}
            >
                {this.state.inviteLinks.map(
                    ({ link, showCopyMsg, roleID }, linkIndex) => (
                        <Margin bottom="3px" key={link}>
                            <LinkAndRoleBox viewportBreakpoint="normal">
                                <CopyLinkBox>
                                    <LinkBox
                                        left="small"
                                        onClick={() =>
                                            this.processEvent(
                                                'copyInviteLink',
                                                { linkIndex },
                                            )
                                        }
                                    >
                                        <Link>
                                            {showCopyMsg
                                                ? 'Copied to clipboard'
                                                : link.split('https://')[1]}
                                        </Link>
                                        <IconContainer id={'iconContainer'}>
                                            <Icon
                                                heightAndWidth="14px"
                                                path={icons.copy}
                                                onClick={() =>
                                                    this.processEvent(
                                                        'copyInviteLink',
                                                        { linkIndex },
                                                    )
                                                }
                                            />
                                            <Icon
                                                heightAndWidth="14px"
                                                path={icons.goTo}
                                                onClick={
                                                    () => window.open(link)
                                                    // this.processEvent('copyLink', { linkIndex })
                                                }
                                            />
                                        </IconContainer>
                                    </LinkBox>
                                </CopyLinkBox>
                                <PermissionArea>
                                    <ButtonTooltip
                                        position={'bottomSingleLine'}
                                        tooltipText={
                                            sharedListRoleIDToString(roleID) ===
                                            'Contributor' ? (
                                                <span>
                                                    Add highlights, pages &
                                                    replies
                                                </span>
                                            ) : (
                                                <span>
                                                    View & reply to highlights &
                                                    pages
                                                </span>
                                            )
                                        }
                                    >
                                        <PermissionText
                                            title={null}
                                            viewportBreakpoint="normal"
                                        >
                                            {sharedListRoleIDToString(roleID) +
                                                ' Access'}
                                        </PermissionText>
                                    </ButtonTooltip>
                                </PermissionArea>
                            </LinkAndRoleBox>
                        </Margin>
                    ),
                )}
            </ShareSectionContainer>
        )
    }

    private renderMainContent() {
        if (
            this.state.mode === 'confirm-space-delete' &&
            this.props.onDeleteSpaceConfirm != null
        ) {
            return (
                <>
                    <TitleBox>Delete this Space?</TitleBox>
                    <DetailsText>
                        This does not delete the pages in it
                    </DetailsText>
                    <PrimaryAction
                        onClick={this.props.onDeleteSpaceConfirm}
                        label={<ButtonLabel>Delete</ButtonLabel>}
                    />
                    <SecondaryAction
                        onClick={() =>
                            this.processEvent('cancelDeleteSpace', null)
                        }
                        label={<ButtonLabel>Cancel</ButtonLabel>}
                    />
                </>
            )
        }

        if (
            this.state.loadState === 'running' ||
            this.state.inviteLinksLoadState === 'running'
        ) {
            return (
                <LoadingContainer>
                    <LoadingIndicator size={30} />
                </LoadingContainer>
            )
        }

        return (
            <>
                {this.renderShareLinks()}
                <MenuButton
                    onClick={() => this.processEvent('deleteSpace', null)}
                >
                    <Margin horizontal="10px">
                        <Icon heightAndWidth="14px" path={icons.trash} />
                    </Margin>
                    Delete
                </MenuButton>
                <EditArea>
                    <EditableMenuItem
                        {...this.props.editableProps}
                        onNameChange={(name) =>
                            this.processEvent('updateSpaceName', { name })
                        }
                        nameValue={this.state.nameValue}
                    />
                </EditArea>
            </>
        )
    }

    render() {
        return (
            <ModalRoot
                ref={this.containerElRef}
                fixedPosition={this.props.fixedPositioning}
            >
                {!this.props.fixedPositioning && (
                    <Overlay onClick={this.closeModal} />
                )}
                <ModalContent
                    // onMouseLeave={closeModal}
                    x={this.props.xPosition}
                    y={this.props.yPosition}
                    fixedPosition={this.props.fixedPositioning}
                >
                    <MenuContainer>{this.renderMainContent()}</MenuContainer>
                </ModalContent>
            </ModalRoot>
        )
    }
}

const PermissionArea = styled.div`
    z-index: auto;
`

const EditArea = styled.div`
    border-top: 1px solid #f0f0f0;
    color: ${(props) => props.theme.colors.normalText};
    width: fill-available;
    padding-bottom: 5px;
`

const IconContainer = styled.div`
    display: none;
    grid-gap: 5px;
    grid-auto-flow: column;

    & > div {
        background: white;
    }
`

const LoadingContainer = styled.div`
    display: flex;
    height: 126px;
    justify-content: center;
    align-items: center;
    border-bottom: 1px solid #f0f0f0;
`

const ShareSectionContainer = styled.div`
    padding: 10px;
    border-bottom: 1px solid #f0f0f0;
`

const ButtonLabel = styled.div`
    display: grid;
    grid-auto-flow: column;
    grid-gap: 5px;
    align-items: center;
    font-size: 14px;
    font-weight: 400;

    & * {
        cursor: pointer;
    }
`

const ModalRoot = styled.div<{ fixedPosition: boolean }>`
    ${(props) =>
        props.fixedPosition
            ? ''
            : `
    z-index: 1000;
    border-radius: 12px;
    height: 100%;
    width: 500px;
    position: relative;
    padding-top: 80px;
    width: 100%;
`}
`

/* Modal content */

const ModalContent = styled.div<{
    x: number
    y: number
    fixedPosition: boolean
}>`
    z-index: 999;
    position: fixed;
    top: ${(props) => (props.fixedPosition ? 0 : props.y)}px;
    left: ${(props) => (props.fixedPosition ? 0 : props.x)}px;
    text-align: center;
    border-radius: 4px;
    width: 300px;
`

const Overlay = styled.div`
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 995;
    border-radius: 5px;
`

const MenuContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 350px;
    position: absolute;
    background-color: ${colors.white};
    box-shadow: 0px 22px 26px 18px rgba(0, 0, 0, 0.03);
    border-radius: 12px;
    z-index: 1;
`

const IconBox = styled.div<Props>`
    display: ${(props) =>
        props.hasActivity ||
        props.newItemsCount ||
        props.dropReceivingState?.isDraggedOver ||
        props.dropReceivingState?.wasPageDropped
            ? 'flex'
            : 'None'};

    height: 100%;
    align-items: center;
    justify-content: flex-end;
    padding-right: 10px;
    padding-left: 5px;
`

const TitleBox = styled.div`
    display: flex;
    flex: 1;
    width: 100%;
    height: 100%;
    padding-left: 15px;
    align-items: center;
    padding-right: 10px;
`

const MenuButton = styled.div`
    height: 34px;
    font-family: 'Inter', sans-serif;
    font-weight: ${fonts.primary.weight.normal};
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    line-height: 18px;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    cursor: pointer;
    padding: 0px 10px;
    margin-top: 5px;
    margin-bottom: 5px;
    &:hover {
        background-color: ${(props) => props.theme.colors.lightHover};
    }
    & > div {
        width: auto;
    }
`

// probably want to use timing function to get this really looking good. This is just quick and dirty

const blinkingAnimation = keyframes`
 0% {
    background-color: ${(props) => props.theme.colors.lightHover};
 }
 50% {
 background-color: transparent;
 }
 100% {
    background-color: ${(props) => props.theme.colors.lightHover};
 }

`

const LinkAndRoleBox = styled.div<{
    viewportBreakpoint: string
}>`
    width: fill-available;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 5px;

    ${(props) =>
        (props.viewportBreakpoint === 'small' ||
            props.viewportBreakpoint === 'mobile') &&
        css`
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: flex-start;
        `}

    &:hover {
        #iconContainer {
            display: grid;
        }
    }
`

const LinkBox = styled(Margin)`
    width: fill-available;
    display: flex;
    background-color: ${(props) => props.theme.colors.lineGrey};
    font-size: 14px;
    border-radius: 3px;
    text-align: left;
    height: 30px;
    cursor: pointer;
    padding-right: 10px;
    color: ${(props) => props.theme.colors.lighterText};
`

const Link = styled.span`
    display: flex;
    flex-direction: row;
    width: 100%;
    padding: 5px 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow-x: scroll;
    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
`

const CopyLinkBox = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
`

const DetailsText = styled.span`
    opacity: 0.8;
    font-size: 12px;
`

const PermissionText = styled.span<{
    viewportBreakpoint: string
}>`
    color: ${(props) => props.theme.colors.normalText};
    opacity: 0.8;
    display: flex;
    flex-direction: row;
    white-space: nowrap;
    justify-content: flex-end;
    font-size: 12px;
    z-index: 0;

    ${(props) =>
        (props.viewportBreakpoint === 'small' ||
            props.viewportBreakpoint === 'mobile') &&
        css`
            padding-left: 0px;
        `}
`
