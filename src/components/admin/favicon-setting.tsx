'use client';

import { useState } from 'react';
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput } from "@/components/ui/input-group";
import { Globe, Image as ImageIcon } from "lucide-react";
import { MediaPicker } from "@/components/media/media-picker";

interface FaviconSettingProps {
    defaultUrl: string;
    translations: {
        favicon: string;
        faviconDesc: string;
        placeholder: string;
        selectImage: string;
    };
}

export function FaviconSetting({ defaultUrl, translations }: FaviconSettingProps) {
    const [url, setUrl] = useState(defaultUrl);

    function handleMediaSelect(selectedUrl: string) {
        setUrl(selectedUrl);
    }

    return (
        <div className="space-y-3">
            <InputGroup>
                <InputGroupAddon>
                    <InputGroupText>
                        {url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={url} alt="Favicon" className="size-4 object-contain" />
                        ) : (
                            <Globe className="size-4" />
                        )}
                    </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                    id="faviconUrl"
                    name="faviconUrl"
                    placeholder={translations.placeholder}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
                <MediaPicker
                    onSelect={handleMediaSelect}
                    trigger={
                        <button type="button" className="px-3 border-l hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <ImageIcon className="size-4 text-gray-500" />
                        </button>
                    }
                />
            </InputGroup>
            <p className="text-sm text-gray-500">{translations.faviconDesc}</p>
        </div>
    );
}
