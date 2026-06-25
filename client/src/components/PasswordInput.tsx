import { EyeIcon, EyeOffIcon } from "lucide-react"
import { useState, type InputHTMLAttributes } from "react"

type PasswordInputProps=Omit<InputHTMLAttributes<HTMLInputElement>,"type">

export default function PasswordInput({className="",onFocus,...props}:PasswordInputProps){
    const [visible,setVisible]=useState(false)
    const [editable,setEditable]=useState(false)
    return <div className="relative">
        <input
            {...props}
            type={visible ? "text" : "password"}
            className={`${className} pr-11`}
            autoComplete="new-password"
            readOnly={!editable}
            onFocus={event=>{setEditable(true);onFocus?.(event)}}
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
        />
        <button
            type="button"
            onClick={()=>setVisible(current=>!current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-app-text-light hover:text-app-green focus-visible:outline-2 focus-visible:outline-app-green"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
        >
            {visible ? <EyeOffIcon className="size-4"/> : <EyeIcon className="size-4"/>}
        </button>
    </div>
}
