import { $$, $ } from "./dom.js"

class GoogleTranslate {
  static SUPPORTED_LANGUAGES = ["es", "en", "fr", "de", "pt", "ru", "ja", "zh"]

  static FULL_LANGUAGE_CODES = {
    es: "es-ES",
    en: "en-US",
    fr: "fr-FR",
    de: "de-DE",
    pt: "pt-PT",
    ru: "ru-RU",
    ja: "ja-JP",
    zh: "zh-CN",
  }

  static DEFAULT_SOURCE_LANGUAGE = "es"
  static DEFAULT_TARGET_LANGUAGE = "en"

  constructor() {
    this.init()
    this.setUpEventListeners()

    this.translationTimeout = null
    this.currentTranslator = null
    this.currentTranslatorKey = null
    this.currentDetector = null
  }

  init() {
    // recurperar todos los elementos necesarios
    this.inputTextArea = $("#inputText")
    this.outputTextArea = $("#outputText")
    this.swapLanguagesButton = $("#swapLanguages")
    this.sourceLanguageSelect = $("#sourceLanguage")
    this.targetLanguageSelect = $("#targetLanguage")
    this.micButton = $("#micButton")
    this.copyButton = $("#copyButton")
    this.speakerButton = $("#speakerButton")

    // Configuración inicial
    this.targetLanguageSelect.value = GoogleTranslate.DEFAULT_TARGET_LANGUAGE

    // Verificar si el navegador soporta el detector de idiomas y la traducción
    this.checkApiAvailability()
  }

  checkApiAvailability() {
    this.hasNativeTranslator = "Translator" in window
    this.hasNativeDetector = "LanguageDetector" in window

    if (!this.hasNativeTranslator || !this.hasNativeDetector) {
      console.warn(
        "APIs nativas de traducción y detección de idiomas no están soportadas en este navegador."
      )
    } else {
      console.log("✅ APIs nativas de IA disponibles")
    }
  }

  setUpEventListeners() {
    this.inputTextArea.addEventListener("input", () => {
      this.debounce()
    })

    this.sourceLanguageSelect.addEventListener("change", () =>
      this.updateTranslator()
    )
    this.targetLanguageSelect.addEventListener("change", () =>
      this.updateTranslator()
    )

    this.swapLanguagesButton.addEventListener("click", () =>
      this.swapLanguages()
    )

    this.micButton.addEventListener("click", () =>
      this.startSpeechRecognition()
    )

    this.speakerButton.addEventListener("click", () =>
      this.startSpeakTranslation()
    )
  }

  debounce() {
    clearTimeout(this.translationTimeout)
    this.translationTimeout = setTimeout(() => {
      this.updateTranslator()
    }, 500)
  }

  updateDetectedLanguage(language) {
    const option = this.sourceLanguageSelect.querySelector(
      `option[value="${language}"]`
    )
    if (option) {
      const autoOption = this.sourceLanguageSelect.querySelector(
        "option[value='auto']"
      )
      const textOption = option.textContent
      autoOption.textContent = `Detectar idioma (${textOption})`
    }
  }

  async getTranslation(text) {
    const sourceLanguage =
      this.sourceLanguageSelect.value === "auto"
        ? await this.detectLanguage(text)
        : this.sourceLanguageSelect.value
    const targetLanguage = this.targetLanguageSelect.value

    if (sourceLanguage === targetLanguage) return text

    try {
      const status = await window.Translator.availability({
        sourceLanguage,
        targetLanguage,
      })

      if (status === "unavailable") {
        throw new Error("Traducción no disponible")
      }
    } catch (error) {
      console.error(error)
      throw new Error("Traducción no disponible")
    }

    const translatorKey = `${sourceLanguage}-${targetLanguage}`

    try {
      if (
        !this.currentTranslatorKey ||
        this.currentTranslatorKey !== translatorKey
      ) {
        this.currentTranslator = await window.Translator.create({
          sourceLanguage,
          targetLanguage,
          monitor: (monitor) => {
            monitor.addEventListener("downloadprogress", (event) => {
              console.log(event.loaded)

              this.outputTextArea.innerHTML = `<span class="loading">
            Descargando modelo: ${Math.floor(event.loaded * 100)}%</span>`
            })
          },
        })
      }

      this.currentTranslatorKey = translatorKey

      const translation = await this.currentTranslator.translate(text)
      return translation
    } catch (error) {
      console.error(error)
      return "Error al traducir"
    }
  }

  async updateTranslator() {
    if (this.sourceLanguageSelect.value === "auto") {
      const detectedLanguage = await this.detectLanguage(
        this.inputTextArea.value
      )
      this.updateDetectedLanguage(detectedLanguage)
    }
    try {
      const translation = await this.getTranslation(this.inputTextArea.value)
      this.outputTextArea.value = translation
    } catch (error) {
      console.error(error)
      this.outputTextArea.value = "Error al traducir"
    }
  }

  async swapLanguages() {
    if (this.sourceLanguageSelect.value === "auto") {
     const detectedLanguage = await this.detectLanguage(this.inputTextArea.value)
     this.sourceLanguageSelect.value = detectedLanguage
    }
    const temporalLanguage = this.sourceLanguageSelect.value
    
    this.sourceLanguageSelect.value = this.targetLanguageSelect.value
    this.targetLanguageSelect.value = temporalLanguage

    this.inputTextArea.value = this.outputTextArea.value
    this.outputTextArea.value = ""

    if (this.inputTextArea.value.trim()) {
      this.updateTranslator()
    }
  }

  getFullLanguageCode(language) {
    return GoogleTranslate.FULL_LANGUAGE_CODES[language] ?? GoogleTranslate.DEFAULT_SOURCE_LANGUAGE
  }

  async startSpeechRecognition() {
    const hasNativeSpeechRecognition = "SpeechRecognition" in window || "webkitSpeechRecognition" in window
    if (!hasNativeSpeechRecognition) {
      console.warn("El navegador no soporta el reconocimiento de voz")
      return
    }

    const SpeechRecognition = new window.SpeechRecognition()
    const webkitSpeechRecognition = new window.webkitSpeechRecognition()

    const recognition = SpeechRecognition ?? webkitSpeechRecognition

    recognition.continuous = false
    recognition.interimResults = false

    const language = this.sourceLanguageSelect.value === "auto"
        ? await this.detectLanguage(this.inputTextArea.value)
        : this.sourceLanguageSelect.value

    recognition.lang = this.getFullLanguageCode(language)
    
    recognition.onstart = () => {
      this.micButton.style.backgroundColor = "var(--google-red)"
      this.micButton.style.color = "white"
    }

    recognition.onend = () => {
      this.micButton.style.backgroundColor = ""
      this.micButton.style.color = ""
    }

    recognition.onresult = (event) => {
      const [{ transcript }] = event.results[0]
      this.inputTextArea.value = transcript
      this.updateTranslator()
    }

    recognition.onerror = (event) => {
      console.error("Error al reconocer el texto", event)
    }

    recognition.start()
  }

  startSpeakTranslation() {
    const hasNativeSynthesis = "SpeechSynthesis" in window || "webkitSpeechSynthesis" in window
    if (!hasNativeSynthesis) {
      console.warn("El navegador no soporta la sintetización de voz")
      return
    }

    const text = this.outputTextArea.value
    if (!text.trim()) {
      return
    }

    const utterance = new window.SpeechSynthesisUtterance(text)

    utterance.lang = this.getFullLanguageCode(this.targetLanguageSelect.value)
    utterance.rate = 0.8

    utterance.onstart = () => {
      this.speakerButton.style.backgroundColor = "var(--google-green)"
      this.speakerButton.style.color = "white"
    }

    utterance.onend = () => {
      this.speakerButton.style.backgroundColor = ""
      this.speakerButton.style.color = ""
    }

    window.speechSynthesis.speak(utterance)
  }

  async detectLanguage(text) {
    try {
      if (!this.currentDetector) {
        this.currentDetector = await window.LanguageDetector.create({
          expectedLanguages: GoogleTranslate.SUPPORTED_LANGUAGES,
        })
      }

      const languages = await this.currentDetector.detect(text)
      const detectedLanguage = languages[0]?.detectedLanguage

      return detectedLanguage === "und"
        ? GoogleTranslate.DEFAULT_SOURCE_LANGUAGE
        : detectedLanguage
    } catch (error) {
      console.error("No he podido detectar el idioma", error)
      return GoogleTranslate.DEFAULT_SOURCE_LANGUAGE
    }
  }
}

const googleTranslate = new GoogleTranslate()
