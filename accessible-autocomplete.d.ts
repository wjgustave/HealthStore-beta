declare module 'accessible-autocomplete' {
  type Options = {
    element: HTMLElement
    id: string
    source: string[] | ((query: string, populateResults: (results: string[]) => void) => void)
    name?: string
    defaultValue?: string
    minLength?: number
    autoselect?: boolean
    confirmOnBlur?: boolean
    displayMenu?: 'inline' | 'overlay'
    showAllValues?: boolean
    required?: boolean
    inputClasses?: string | null
    menuClasses?: string | null
    dropdownArrow?: () => string
    tNoResults?: () => string
    onConfirm?: (confirmed: string | undefined) => void
  }
  export default function accessibleAutocomplete(options: Options): void
}
