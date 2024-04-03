const INITIAL_WORDS = [
  "a",
  "again",
  "all",
  "also",
  "and",
  "another",
  "any",
  "around",
  "as",
  "ask",
  "at",
  "back",
  "because",
  "become",
  "before",
  "begin",
  "both",
  "but",
  "by",
  "call",
  "can",
  "change",
  "child",
  "come",
  "could",
  "course",
  "day",
  "develop",
  "each",
  "early",
  "end",
  "even",
  "eye",
  "face",
  "fact",
  "few",
  "first",
  "follow",
  "from",
  "general",
  "get",
  "give",
  "good",
  "govern",
  "group",
  "hand",
  "have",
  "he",
  "head",
  "help",
  "here",
  "high",
  "hold",
  "home",
  "how",
  "however",
  "if",
  "increase",
  "interest",
  "it",
  "know",
  "large",
  "last",
  "lead",
  "leave",
  "life",
  "like",
  "line",
  "little",
  "look",
  "make",
  "man",
  "may",
  "mean",
  "might",
  "more",
  "must",
  "need",
  "never",
  "new",
  "no",
  "now",
  "number",
  "of",
  "off",
  "old",
  "on",
  "one",
  "open",
  "or",
  "order",
  "out",
  "over",
  "own",
  "part",
  "people",
  "person",
  "place",
  "plan",
  "play",
  "point",
  "possible",
  "present",
  "problem",
  "program",
  "public",
  "real",
  "right",
  "run",
  "say",
  "see",
  "seem",
  "show",
  "small",
  "some",
  "stand",
  "state",
  "still",
  "such",
  "system",
  "take",
  "than",
  "that",
  "the",
  "then",
  "there",
  "these",
  "they",
  "thing",
  "think",
  "this",
  "those",
  "time",
  "to",
  "under",
  "up",
  "use",
  "very",
  "way",
  "what",
  "when",
  "where",
  "while",
  "will",
  "with",
  "without",
  "work",
  "world",
  "would",
  "write",
  "you",
  "she",
  "set",
  "we",
  "long",
  "in",
  "many",
  "do",
  "after",
  "which",
  "so",
  "same",
  "other",
  "house",
  "during",
  "much",
  "just",
  "consider",
  "since",
  "should",
  "only",
  "tell",
  "about"
]

const timeEl = document.querySelector('time')
const paragraphEl = document.querySelector('p')
const inputEl = document.querySelector('input')
const game = document.querySelector('#game')
const results = document.querySelector('#results')
const wpmEl = document.querySelector('#wpm')
const accuracyEl = document.querySelector('#accuracy')
const button = document.querySelector('#reload-button')

const INITIAL_TIME = 10

let words = []
let currentTime = INITIAL_TIME

initGame()
initEvents()

function initGame() {
  game.style.display = 'flex'
  results.style.display = 'none'
  inputEl.value = ''

  words = INITIAL_WORDS.toSorted(() => Math.random() - 0.5).slice(0, 32)
  currentTime = INITIAL_TIME

  timeEl.textContent = currentTime
  paragraphEl.innerHTML = words.map((word, index) => {
    const letters = word.split('')
    return `
      <word>
        ${
          letters
            .map((letter)=> {
              return `<letter>${letter}</letter>`
        })
       .join('')
      }
      </word>    
    `
  }).join('')
  // set a class active for the first word and the first letter
  const firstWord = paragraphEl.querySelector('word')
  const firstLetter = firstWord.querySelector('letter')
  firstWord.classList.add('active')
  firstLetter.classList.add('active')
  // set the timer
  const intervalTimer = setInterval(() => {
    currentTime--
    timeEl.textContent = currentTime
    if (currentTime <= 0) {
      clearInterval(intervalTimer)
      gameOver()
    }  
  }, 1000)

}

function initEvents() {
  inputEl.addEventListener('keydown', onkeydown)
  inputEl.addEventListener('keyup', onkeyup)
  button.addEventListener('click', initGame)
}

function onkeydown(e) {
  const activeWord = paragraphEl.querySelector('word.active')
  const activeLetter = activeWord.querySelector('letter.active')
  
  const { key } = e
  if (key ===' ') {
    e.preventDefault()
    inputEl.value = ''
    
    const nextWord = activeWord.nextElementSibling
    const nextLetter = nextWord.querySelector('letter')

    activeWord.classList.remove('active', 'marked')
    activeLetter.classList.remove('active')

    nextWord.classList.add('active')
    nextLetter.classList.add('active')


    const hasMissedLetters = activeWord.querySelectorAll('letter:not(.correct)').length > 0
    const classToAdd = hasMissedLetters ? 'marked' : 'correct'
    activeWord.classList.add(classToAdd)
    return
  }
  if (key === 'Backspace') {
    const prevWord = activeWord.previousElementSibling
    const prevLetter = activeLetter.previousElementSibling

    if (!prevWord && !prevLetter) {
      e.preventDefault()
      return
    }
    const wordMarked = paragraphEl.querySelector('word.marked')
    if (wordMarked && !prevLetter) {
      e.preventDefault()
      prevWord.classList.remove('marked')
      prevWord.classList.add('active')

      const letterToGo = prevWord.querySelector('letter:last-child')
      activeLetter.classList.remove('active')
      letterToGo.classList.add('active')

      inputEl.value = [...prevWord.querySelectorAll('letter.correct, letter.incorrect')].map(el => {
        return el.classList.contains('correct') ? el.innerText : '*'
      }).join('')
    }
  }
}

function onkeyup() {
  const inputValue = inputEl.value
  const activeWord = paragraphEl.querySelector('word.active')
  const activeLetter = activeWord.querySelector('letter.active')
  const currentWord = activeWord.innerText.trim()
  inputEl.maxLength = currentWord.length

  const allLetters = activeWord.querySelectorAll('letter')
  // Clean the classes before adding them to the letter
  allLetters.forEach(letter => {
    letter.classList.remove('correct', 'incorrect')
  })
  // Check if the current word is correct based on the current letter
  inputValue.split('').forEach((char, index) => {
    const letter = allLetters[index]
    const letterToCheck = currentWord[index]

    const isCorrect = char === letterToCheck
    letter.classList.add(isCorrect ? 'correct' : 'incorrect')
  })

  // Remove the active class from the currentLetter and adding it to the next letter
  activeLetter.classList.remove('active', 'is-last')
  const inputLength = inputValue.length
  const nextLetter = allLetters[inputLength]
  if (nextLetter) {
    nextLetter.classList.add('active')
  } else {
    activeLetter.classList.add('active', 'is-last')
    // TODO: gameover if isn't a next word
  }
  
}

document.addEventListener('keydown', () => {
  inputEl.focus()
})

function gameOver() {
  game.style.display = 'none'
  results.style.display = 'flex'

  const correctWords = paragraphEl.querySelectorAll('word.correct').length
  const correctLetters = paragraphEl.querySelectorAll('letter.correct').length
  const incorrectLetters = paragraphEl.querySelectorAll('letter.incorrect').length
  const totalLetters = correctLetters + incorrectLetters
  const accuracy = totalLetters > 0 ? (correctLetters / totalLetters) * 100 : 0
  const wpm = correctWords > 0 ? correctWords * 60 / INITIAL_TIME : 0
  wpmEl.textContent = wpm
  accuracyEl.textContent = accuracy.toFixed(2) + '%'
}