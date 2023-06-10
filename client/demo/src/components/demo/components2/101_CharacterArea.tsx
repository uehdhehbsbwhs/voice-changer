import React, { useEffect, useMemo, useState } from "react"
import { useAppState } from "../../../001_provider/001_AppStateProvider"
import { useGuiState } from "../001_GuiStateProvider"
import { OnnxExporterInfo } from "@dannadori/voice-changer-client-js"

export type CharacterAreaProps = {
}


export const CharacterArea = (_props: CharacterAreaProps) => {
    const { serverSetting, clientSetting, initializedRef, volume, bufferingTime, performance } = useAppState()
    const guiState = useGuiState()

    const selected = useMemo(() => {
        if (serverSetting.serverSetting.modelSlotIndex == undefined) {
            return
        }
        return serverSetting.serverSetting.modelSlots[serverSetting.serverSetting.modelSlotIndex]
    }, [serverSetting.serverSetting.modelSlotIndex, serverSetting.serverSetting.modelSlots])


    useEffect(() => {
        const vol = document.getElementById("status-vol") as HTMLSpanElement
        const buf = document.getElementById("status-buf") as HTMLSpanElement
        const res = document.getElementById("status-res") as HTMLSpanElement
        if (!vol || !buf || !res) {
            return
        }
        vol.innerText = volume.toFixed(4)
        buf.innerText = bufferingTime.toString()
        res.innerText = performance.responseTime.toString()

    }, [volume, bufferingTime, performance])

    const portrait = useMemo(() => {
        if (!selected) {
            return <></>
        }

        const icon = selected.iconFile.length > 0 ? selected.iconFile : "./assets/icons/human.png"
        const selectedTermOfUseUrlLink = selected.termsOfUseUrl ? <a href={selected.termsOfUseUrl} target="_blank" rel="noopener noreferrer" className="portrait-area-terms-of-use-link">[terms of use]</a> : <></>


        return (
            <div className="portrait-area">
                <div className="portrait-container">
                    <img className="portrait" src={icon} alt={selected.name} />
                    <div className="portrait-area-status">
                        <p>vol: <span id="status-vol">0</span></p>
                        <p>buf: <span id="status-buf">0</span> ms</p>
                        <p>res: <span id="status-res">0</span> ms</p>
                    </div>
                    <div className="portrait-area-terms-of-use">
                        {selectedTermOfUseUrlLink}
                    </div>
                </div>
            </div>
        )
    }, [selected])


    const [startWithAudioContextCreate, setStartWithAudioContextCreate] = useState<boolean>(false)
    useEffect(() => {
        if (!startWithAudioContextCreate) {
            return
        }
        guiState.setIsConverting(true)
        clientSetting.start()
    }, [startWithAudioContextCreate])

    const startControl = useMemo(() => {
        const onStartClicked = async () => {
            if (serverSetting.serverSetting.enableServerAudio == 0) {
                if (!initializedRef.current) {
                    while (true) {
                        await new Promise<void>((resolve) => {
                            setTimeout(resolve, 500)
                        })
                        if (initializedRef.current) {
                            break
                        }
                    }
                    setStartWithAudioContextCreate(true)
                } else {
                    guiState.setIsConverting(true)
                    await clientSetting.start()
                }
            } else {
                serverSetting.updateServerSettings({ ...serverSetting.serverSetting, serverAudioStated: 1 })
                guiState.setIsConverting(true)
            }
        }
        const onStopClicked = async () => {
            if (serverSetting.serverSetting.enableServerAudio == 0) {
                guiState.setIsConverting(false)
                await clientSetting.stop()
            } else {
                guiState.setIsConverting(false)
                serverSetting.updateServerSettings({ ...serverSetting.serverSetting, serverAudioStated: 0 })
            }
        }
        const startClassName = guiState.isConverting ? "character-area-control-button-active" : "character-area-control-button-stanby"
        const stopClassName = guiState.isConverting ? "character-area-control-button-stanby" : "character-area-control-button-active"

        return (
            <div className="character-area-control">
                <div className="character-area-control-buttons">
                    <div onClick={onStartClicked} className={startClassName}>start</div>
                    <div onClick={onStopClicked} className={stopClassName}>stop</div>
                </div>
            </div>
        )
    }, [
        guiState.isConverting,
        clientSetting.start,
        clientSetting.stop,
        serverSetting.serverSetting,
        serverSetting.updateServerSettings
    ])

    const gainControl = useMemo(() => {
        const currentInputGain = serverSetting.serverSetting.enableServerAudio == 0 ? clientSetting.clientSetting.inputGain : serverSetting.serverSetting.serverInputAudioGain
        const inputValueUpdatedAction = serverSetting.serverSetting.enableServerAudio == 0 ?
            async (val: number) => {
                await clientSetting.updateClientSetting({ ...clientSetting.clientSetting, inputGain: val })
            } :
            async (val: number) => {
                await serverSetting.updateServerSettings({ ...serverSetting.serverSetting, serverInputAudioGain: val })
            }

        const currentOutputGain = serverSetting.serverSetting.enableServerAudio == 0 ? clientSetting.clientSetting.outputGain : serverSetting.serverSetting.serverOutputAudioGain
        const outputValueUpdatedAction = serverSetting.serverSetting.enableServerAudio == 0 ?
            async (val: number) => {
                await clientSetting.updateClientSetting({ ...clientSetting.clientSetting, outputGain: val })
            } :
            async (val: number) => {
                await serverSetting.updateServerSettings({ ...serverSetting.serverSetting, serverOutputAudioGain: val })
            }


        return (
            <div className="character-area-control">
                <div className="character-area-control-title">
                    GAIN:
                </div>
                <div className="character-area-control-field">
                    <div className="character-area-slider-control">
                        <span className="character-area-slider-control-kind">in</span>
                        <span className="character-area-slider-control-slider">
                            <input type="range" min="0.1" max="10.0" step="0.1" value={currentInputGain} onChange={(e) => {
                                inputValueUpdatedAction(Number(e.target.value))
                            }}></input>
                        </span>
                        <span className="character-area-slider-control-val">{currentInputGain}</span>
                    </div>

                    <div className="character-area-slider-control">
                        <span className="character-area-slider-control-kind">out</span>
                        <span className="character-area-slider-control-slider">
                            <input type="range" min="0.1" max="10.0" step="0.1" value={currentOutputGain} onChange={(e) => {
                                outputValueUpdatedAction(Number(e.target.value))
                            }}></input>
                        </span>
                        <span className="character-area-slider-control-val">{currentOutputGain}</span>
                    </div>

                </div>
            </div>
        )
    }, [serverSetting.serverSetting, clientSetting.clientSetting, clientSetting.updateClientSetting, serverSetting.updateServerSettings])

    const tuningCotrol = useMemo(() => {
        const currentTuning = serverSetting.serverSetting.tran
        const tranValueUpdatedAction = async (val: number) => {
            await serverSetting.updateServerSettings({ ...serverSetting.serverSetting, tran: val })
        }

        return (
            <div className="character-area-control">
                <div className="character-area-control-title">
                    TUNE:
                </div>
                <div className="character-area-control-field">
                    <div className="character-area-slider-control">
                        <span className="character-area-slider-control-kind"></span>
                        <span className="character-area-slider-control-slider">
                            <input type="range" min="-50" max="50" step="1" value={currentTuning} onChange={(e) => {
                                tranValueUpdatedAction(Number(e.target.value))
                            }}></input>
                        </span>
                        <span className="character-area-slider-control-val">{currentTuning}</span>
                    </div>

                </div>
            </div>
        )
    }, [serverSetting.serverSetting, clientSetting.updateClientSetting])


    const indexCotrol = useMemo(() => {
        const currentIndexRatio = serverSetting.serverSetting.indexRatio
        const indexRatioValueUpdatedAction = async (val: number) => {
            await serverSetting.updateServerSettings({ ...serverSetting.serverSetting, indexRatio: val })
        }

        return (
            <div className="character-area-control">
                <div className="character-area-control-title">
                    INDEX:
                </div>
                <div className="character-area-control-field">
                    <div className="character-area-slider-control">
                        <span className="character-area-slider-control-kind"></span>
                        <span className="character-area-slider-control-slider">
                            <input type="range" min="0" max="1" step="0.1" value={currentIndexRatio} onChange={(e) => {
                                indexRatioValueUpdatedAction(Number(e.target.value))
                            }}></input>
                        </span>
                        <span className="character-area-slider-control-val">{currentIndexRatio}</span>
                    </div>

                </div>
            </div>
        )
    }, [serverSetting.serverSetting, clientSetting.updateClientSetting])


    const modelSlotControl = useMemo(() => {
        if (!selected) {
            return <></>
        }
        const onUpdateDefaultClicked = async () => {
            await serverSetting.updateModelDefault()
        }

        const onnxExportButtonAction = async () => {
            if (guiState.isConverting) {
                alert("cannot export onnx when voice conversion is enabled")
                return
            }

            document.getElementById("dialog")?.classList.add("dialog-container-show")
            guiState.stateControls.showWaitingCheckbox.updateState(true)
            const res = await serverSetting.getOnnx() as OnnxExporterInfo
            const a = document.createElement("a")
            a.href = res.path
            a.download = res.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            guiState.stateControls.showWaitingCheckbox.updateState(false)

        }

        const exportOnnx = selected.modelFile.endsWith("pth") ? (
            <div className="character-area-button" onClick={onnxExportButtonAction}>export onnx</div>
        ) : <></>
        return (
            <div className="character-area-control">
                <div className="character-area-control-title">

                </div>
                <div className="character-area-control-field">
                    <div className="character-area-buttons">
                        <div className="character-area-button" onClick={onUpdateDefaultClicked}>save default</div>
                        {exportOnnx}
                    </div>
                </div>
            </div>
        )
    }, [selected, serverSetting.getOnnx, serverSetting.updateModelDefault])

    const characterArea = useMemo(() => {
        return (
            <div className="character-area">
                {portrait}
                <div className="character-area-control-area">
                    {startControl}
                    {gainControl}
                    {tuningCotrol}
                    {indexCotrol}
                    {modelSlotControl}
                </div>
            </div>
        )
    }, [portrait, startControl, gainControl, tuningCotrol, modelSlotControl])

    return characterArea
}