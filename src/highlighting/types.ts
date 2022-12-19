export type { Anchor } from '@worldbrain/memex-common/lib/annotations/types'
import { Annotation } from 'src/annotations/types'
import { SaveAndRenderHighlightDeps } from 'src/highlighting/ui/highlight-interactions'
import { AnnotationClickHandler } from './ui/types'

export type Highlight = Pick<Annotation, 'url' | 'selector'> & {
    temporary?: boolean
    domElements?: HighlightElement[]
}

export type HighlightElement = HTMLElement

export interface HighlightInteractionsInterface {
    renderHighlights: (
        highlights: Highlight[],
        openSidebar: AnnotationClickHandler,
    ) => Promise<Highlight[]>
    renderHighlight: (
        highlight: Highlight,
        openSidebar: AnnotationClickHandler,
        temporary?: boolean,
    ) => Promise<Highlight>
    scrollToHighlight: ({ url }: Highlight) => void
    highlightAndScroll: (annotation: Annotation) => void
    attachEventListenersToNewHighlights: (
        highlight: Highlight,
        openSidebar: AnnotationClickHandler,
    ) => void
    removeHoveredHighlights: ({ url }: Highlight) => void
    removeTempHighlights: () => void
    hoverOverHighlight: ({ url }: Highlight) => void
    selectHighlight: ({ url }: Highlight) => void
    removeSelectedHighlights: (url) => void
    resetHighlightsStyles: () => void
    sortAnnotationsByPosition: (annotations: Annotation[]) => Annotation[]
    _removeHighlight: (highlight: Element) => void
    removeAnnotationHighlight: (url: string) => void
    removeAnnotationHighlights: (urls: string[]) => void
    saveAndRenderHighlight: (
        params: SaveAndRenderHighlightDeps,
    ) => Promise<void>
    saveAndRenderHighlightAndEditInSidebar: (
        params: SaveAndRenderHighlightDeps,
    ) => Promise<void>
}
