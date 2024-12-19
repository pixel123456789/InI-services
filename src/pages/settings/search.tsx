import { useTranslation } from "react-i18next";
import { useGlobalState } from "@ekwoka/preact-global-state";
import { SquareButton } from "../../interface/button";
import { SquareInput } from "../../interface/input";
import { Obfuscated } from "../../util/obfuscate";
import { GoogleLogo } from "../../assets/searchEngines/googleLogo";
import { DuckDuckGoLogo } from "../../assets/searchEngines/duckDuckGoLogo";
import { BingLogo } from "../../assets/searchEngines/bingLogo";
import { YahooLogo } from "../../assets/searchEngines/yahooLogo";
import { BraveLogo } from "../../assets/searchEngines/braveLogo";
import { QwantLogo } from "../../assets/searchEngines/qwantLogo";
import { SearXNGLogo } from "../../assets/searchEngines/searXNGLogo";
import { EcosiaLogo } from "../../assets/searchEngines/ecosiaLogo";
import searchEngineData from "../../assets/searchEngineData.json";

function SearchSettings() {
    const { t } = useTranslation();
   
    const [searchEngine, setSearchEngine] = useGlobalState<string>("engine", localStorage.getItem("metallic/engine") || searchEngineData.google);

    return (
        <>
            <h1 class="text-4xl font-bold mb-8">{t("settings.search.service.title")}</h1>
            <h1 class="text-4xl font-bold my-8">{t("settings.search.searchEngine.title")}</h1>
            <section class="flex flex-wrap items-center gap-3">
                <SquareButton active={searchEngine == searchEngineData.google} onClick={() => setSearchEngine(searchEngineData.google)}>
                    <GoogleLogo />
                    <span class="font-bold">Google</span>
                </SquareButton>
                <SquareButton active={searchEngine == searchEngineData.duckduckgo} onClick={() => setSearchEngine(searchEngineData.duckduckgo)}>
                    <DuckDuckGoLogo />
                    <span class="font-bold">DuckDuckGo</span>
                </SquareButton>
                <SquareButton active={searchEngine == searchEngineData.bing} onClick={() => setSearchEngine(searchEngineData.bing)}>
                    <BingLogo />
                    <span class="font-bold">Bing</span>
                </SquareButton>
                <SquareButton active={searchEngine == searchEngineData.yahoo} onClick={() => setSearchEngine(searchEngineData.yahoo)}>
                    <YahooLogo />
                    <span class="font-bold">Yahoo</span>
                </SquareButton>
                <SquareButton active={searchEngine == searchEngineData.brave} onClick={() => setSearchEngine(searchEngineData.brave)}>
                    <BraveLogo />
                    <span class="font-bold">Brave</span>
                </SquareButton>
                <SquareButton active={searchEngine == searchEngineData.qwant} onClick={() => setSearchEngine(searchEngineData.qwant)}>
                    <QwantLogo />
                    <span class="font-bold">Qwant</span>
                </SquareButton>
                <SquareButton active={searchEngine == searchEngineData.searxng} onClick={() => setSearchEngine(searchEngineData.searxng)}>
                    <SearXNGLogo />
                    <span class="font-bold">SearXNG</span>
                </SquareButton>
                <SquareButton active={searchEngine == searchEngineData.ecosia} onClick={() => setSearchEngine(searchEngineData.ecosia)}>
                    <EcosiaLogo />
                    <span class="font-bold">Ecosia</span>
                </SquareButton>
            </section>
            <h1 class="text-4xl font-bold my-8"><Obfuscated>{t("settings.search.customSearchEngine.title")}</Obfuscated></h1>
            <section class="flex flex-wrap items-center gap-3">
                <SquareInput placeholder={t("settings.search.customSearchEngine.input")} value={searchEngine} onInput={(e: any) => setSearchEngine(e.target.value)} />
            </section>
            
        </>
    )
}

export { SearchSettings };
