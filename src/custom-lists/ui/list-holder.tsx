import * as React from 'react'
import classNames from 'classnames'
import { maxPossibleTags } from 'src/sidebar/annotations-sidebar/utils'
import { ClickHandler } from 'src/sidebar/annotations-sidebar/types'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'

const styles = require('src/common-ui/components/tag-holder.css')

interface Props {
    lists: string[]
    clickHandler: ClickHandler<HTMLElement>
    // deleteList: (tag: string) => void
}

interface State {
    maxTagsAllowed: number
}

/**
 * Tag Holder to display all the tags.
 */
class ListHolder extends React.Component<Props, State> {
    state = {
        maxTagsAllowed: 100,
    }

    componentDidMount() {
        this._findMaxTagsAllowed()
    }

    componentDidUpdate(prevProps: Props) {
        if (this.props.lists.length !== prevProps.lists.length) {
            this._findMaxTagsAllowed()
        }
    }

    private _findMaxTagsAllowed() {
        const { lists } = this.props
        if (!lists.length) {
            return
        }
        const maxTagsAllowed = maxPossibleTags(lists)
        this.setState({ maxTagsAllowed })
    }

    render() {
        const { lists, clickHandler } = this.props

        return (
            <div className={styles.tagHolderContainer} onClick={clickHandler}>
                <TooltipBox tooltipText="Add Collections" placement="bottom">
                    <div className={styles.tagHolder} onClick={clickHandler}>
                        <span
                            className={classNames(
                                styles.placeholder,
                                lists.length > 0 && styles.placeholder_alt,
                            )}
                        >
                            <span className={styles.tagIcon} />
                        </span>
                    </div>
                </TooltipBox>
            </div>
        )
    }
}

export default ListHolder
