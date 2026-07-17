import { BikeIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { footerData } from "../assets/assets"


const Footer = () => {
    return (
        <footer className="bg-app-green text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* top */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div>
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <BikeIcon className="size-6 text-white" />
                            <span className="text-xl font-semibold">{footerData.brand.name}</span>

                        </Link>

                        <p className="text-sm text-white/70 mb-4">{footerData.brand.description}</p>

                    </div>

                    {/* Dynamic sections */}
                    {footerData.sections.map((section, i)=>(
                        <div key={i}>
                            <h3 className="text-sm font-semibold uppercase mb-4">{section.title}</h3>
                            <ul className="space-y-2.5">
                                {section.links.map((link, i)=>(
                                    <li key={i}>
                                        <Link to={link.to} className="text-sm text-white/70 hover:text-white">
                                            {link.label}
                                        </Link>

                                    </li>

                                ))}

                            </ul>

                        </div>
                    ))}

                    {/* Contact */}
                    <div>
                        <h3 className="text-sm font-semibold uppercase mb-4">Project</h3>
                        <ul className="space-y-3">
                            {footerData.contact.map((item, i)=>{
                                const Icon=item.icon
                                return (
                                    <li key={i}>
                                        <a href={item.href} target="_blank" rel="noreferrer" className="flex gap-3 text-sm text-white/70 hover:text-white">
                                            <Icon className="size-4 text-white"/>{item.text}
                                        </a>
                                    </li>
                                )
                            })}

                        </ul>
                    </div>



                </div>

                {/* bottom */}
                <div className="border-t border-white/10 mt-10 pt-6 flex justify-center sm:justify-start">
                    <p className="text-xs text-white/50">{footerData.bottom.copyright}</p>
                </div>
                <div>

                </div>

            </div>
        </footer>
    )
}

export default Footer
