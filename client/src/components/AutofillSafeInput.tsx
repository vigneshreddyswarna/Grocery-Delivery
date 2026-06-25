import { useState, type InputHTMLAttributes } from "react"

type AutofillSafeInputProps=InputHTMLAttributes<HTMLInputElement>

export default function AutofillSafeInput({onFocus,...props}:AutofillSafeInputProps){
    const [editable,setEditable]=useState(false)
    return <input
        {...props}
        autoComplete="off"
        readOnly={!editable}
        onFocus={event=>{
            setEditable(true)
            onFocus?.(event)
        }}
        data-lpignore="true"
        data-1p-ignore="true"
        data-bwignore="true"
    />
}
