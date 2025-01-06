import { Head } from "../components/head";
import { useTranslation } from "react-i18next";
import { useState, useRef } from "preact/hooks";
import { Web, setWeb } from "../components/web";
import { useGlobalState } from "@ekwoka/preact-global-state";
import { SearchIcon } from "../assets/searchIcon";
import { CloseIcon } from "../assets/closeIcon";
import linksData from "../assets/links.json";

declare global {
    interface Window {
        chemical: {
            encode: Function;
        };
    }
}

interface LinkItem {
    name: string;
    url: string;
    icon: string;
    description: string;
}

function Links() {
    const { t } = useTranslation();
    const [service] = useGlobalState<string>(
        "service",
        localStorage.getItem("metallic/service") || "uv"
    );
    const [webOpen, setWebOpen] = useState(false);
    const search = useRef<HTMLInputElement>(null);
    const [searchValue, setSearchValue] = useState("");
    const [searchHasValue, setSearchHasValue] = useState(false);
    const scrollBuffer = 250;
    const resultsIncrease = 20;
    const [resultsNumber, setResultsNumber] = useState(resultsIncrease);

    // Define `links` as an array of LinkItem
    const links: LinkItem[] = linksData;

    async function openLink(url: string) {
        //@ts-ignore
        setWeb(await window.chemical.encode(url, { service }), webOpen, setWebOpen);
    }

    const handleChange = async (e: any) => {
        setSearchHasValue(e.target.value !== "");
    };

    function clearSearch() {
        if (search.current) {
            search.current.value = "";
            setSearchValue("");
            setSearchHasValue(false);
            search.current.focus();
        }
    }

    const handleSearch = async (e: any) => {
        setSearchValue(e.target.value.toLowerCase().trim());
    };

    const filteredLinks = links.filter((link: LinkItem) => {
        if (!searchValue) {
            return true; // Show all links if no search value
        } else {
            return link.name.toLowerCase().trim().includes(searchValue);
        }
    });

    const displayedLinks = filteredLinks.slice(0, Math.min(resultsNumber, filteredLinks.length));

    window.addEventListener("scroll", function () {
        if (document.body.scrollHeight <= window.scrollY + window.innerHeight + scrollBuffer) {
            if (resultsNumber !== filteredLinks.length) {
                setResultsNumber((old: number) => Math.min(old + resultsIncrease, filteredLinks.length));
            }
        }
    });

    return (
        <>
            <Head pageTitle={t("Links | InI Services")} />
            <Web open={webOpen} setOpen={setWebOpen} />
            <div class="flex flex-col items-center justify-center mb-8">
                <div class="bg-secondary w-[600px] h-14 flex items-center justify-center rounded-lg">
                    <div class="w-16 h-full flex items-center justify-center shrink-0">
                        <SearchIcon />
                    </div>
                    <input
                        ref={search}
                        autoFocus={true}
                        placeholder={t("links.searchPlaceholder")}
                        onKeyUp={handleSearch}
                        onChange={handleChange}
                        class="bg-transparent w-full h-full outline-none text-textInverse"
                        spellcheck={false}
                        autocomplete="off"
                        data-enable-grammarly="false"
                    />
                    <button
                        onClick={clearSearch}
                        class="w-16 h-full flex items-center justify-center shrink-0"
                        style={{ display: searchHasValue ? "flex" : "none" }}
                    >
                        <CloseIcon />
                    </button>
                </div>
            </div>
            <p class={"text-center" + (!displayedLinks.length ? "" : " hidden")}>No results found.</p>
            <div class="grid justify-evenly gap-8 grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(auto,16rem))]">
                {displayedLinks.map((link: LinkItem) => (
                    <button
                        onClick={async () => await openLink(link.url)}
                        class="rounded-3xl h-72 bg-secondary flex flex-col p-4 cursor-pointer w-full sm:w-64 text-left"
                    >
                        <div class="h-36 w-full bg-background rounded-xl flex items-center justify-center overflow-hidden select-none">
                            <img
                                src={link.icon}
                                draggable={false}
                                loading="lazy"
                                alt={link.name}
                                class="h-full w-full object-cover"
                            />
                        </div>
                        <div class="whitespace-nowrap overflow-hidden text-lg font-bold mt-3 text-ellipsis">
                            {link.name}
                        </div>
                        <div
                            class="mt-2 text-base overflow-hidden text-ellipsis"
                            style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}
                        >
                            {link.description}
                        </div>
                    </button>
                ))}
            </div>
        </>
    );
}

export { Links };
