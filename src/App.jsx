import React, { useState, useEffect, useRef } from "react";
import { RotateCcw, Trophy, Clock } from "lucide-react";

const sampleTexts = [
    "The quick brown fox jumps over the lazy dog near the riverbank. Programming is the art of telling another human what one wants the computer to do. Practice makes perfect when learning to type faster and more accurately. Web development combines creativity with technical skills to build amazing applications. TypeScript adds static typing to JavaScript making code more maintainable and robust. Learning new skills requires dedication and consistent practice over time. The digital world continues to evolve at a rapid pace every single day. Success comes to those who persevere through challenges and never give up on their dreams.",
    "Technology has transformed the way we communicate and interact with each other. Software engineers solve complex problems using logical thinking and creativity. The internet connects billions of people across the globe instantly. Mobile applications have become an essential part of modern daily life. Cloud computing enables businesses to scale their operations efficiently and cost-effectively. Artificial intelligence is reshaping industries and creating new opportunities for innovation. Data science helps organizations make informed decisions based on analytical insights. Cybersecurity protects sensitive information from malicious threats and attacks.",
    "Writing clean code is essential for maintainable software projects that last. Debugging is an important skill that every programmer must master over time. Version control systems help teams collaborate effectively on code repositories. Continuous learning keeps developers relevant in the fast-changing tech industry landscape. Open source contributions benefit the entire programming community worldwide. Testing ensures software reliability and reduces bugs in production environments. Documentation helps other developers understand and use your code properly. Code reviews improve quality and share knowledge among team members effectively.",
];

export default function TypingMaster() {
    const [words, setWords] = useState([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentInput, setCurrentInput] = useState("");
    const [completedWords, setCompletedWords] = useState([]);
    const [started, setStarted] = useState(false);
    const [finished, setFinished] = useState(false);
    const [timeLimit, setTimeLimit] = useState(60);
    const [timeLeft, setTimeLeft] = useState(60);
    const [startTime, setStartTime] = useState(0);
    const [wpm, setWpm] = useState(0);
    const [accuracy, setAccuracy] = useState(100);
    const [errors, setErrors] = useState(0);
    const [correctChars, setCorrectChars] = useState(0);
    const [totalChars, setTotalChars] = useState(0);
    const inputRef = useRef(null);
    const audioContextRef = useRef(null);

    useEffect(() => {
        resetGame();
        // Initialize audio context
        audioContextRef.current = new(window.AudioContext ||
            window.webkitAudioContext)();
    }, []);

    useEffect(() => {
        setTimeLeft(timeLimit);
    }, [timeLimit]);

    useEffect(() => {
        if (started && !finished && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        finishTest();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [started, finished, timeLeft]);

    const playBeep = () => {
        if (!audioContextRef.current) return;

        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);

        oscillator.frequency.value = 400;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContextRef.current.currentTime + 0.1
        );

        oscillator.start(audioContextRef.current.currentTime);
        oscillator.stop(audioContextRef.current.currentTime + 0.1);
    };

    const resetGame = () => {
        const randomText =
            sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
        const wordArray = randomText.split(" ");
        setWords(wordArray);
        setCurrentWordIndex(0);
        setCurrentInput("");
        setCompletedWords([]);
        setStarted(false);
        setFinished(false);
        setTimeLeft(timeLimit);
        setWpm(0);
        setAccuracy(100);
        setErrors(0);
        setCorrectChars(0);
        setTotalChars(0);
        setStartTime(0);
    };

    const finishTest = () => {
        setFinished(true);
        calculateFinalStats();
    };

    const calculateFinalStats = () => {
        const timeElapsed = (timeLimit - timeLeft) / 60;
        const wordsTyped = completedWords.length;
        const calculatedWpm =
            timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
        setWpm(calculatedWpm);

        const acc = totalChars > 0 ? (correctChars / totalChars) * 100 : 100;
        setAccuracy(Math.round(acc));
    };

    const handleInputChange = (e) => {
        if (finished) return;

        const value = e.target.value;

        if (!started && value.length > 0) {
            setStarted(true);
            setStartTime(Date.now());
        }

        // Check if space was pressed (word ends with space but we keep showing it)
        if (
            value.endsWith(" ") &&
            currentInput.length > 0 &&
            !currentInput.endsWith(" ")
        ) {
            const typedWord = value.trim().split(" ").pop() || value.trim();
            const currentWord = words[currentWordIndex];

            // Check if the word is correct
            const isCorrect = typedWord === currentWord;
            setCompletedWords([
                ...completedWords,
                { word: typedWord, correct: isCorrect },
            ]);

            // Update stats
            const wordLength = typedWord.length;
            setTotalChars(totalChars + wordLength);

            if (isCorrect) {
                setCorrectChars(correctChars + wordLength);
            } else {
                const correctCount = typedWord
                    .split("")
                    .filter((char, i) => char === currentWord[i]).length;
                setCorrectChars(correctChars + correctCount);
                setErrors(errors + (wordLength - correctCount));
            }

            // Move to next word
            const nextIndex = currentWordIndex + 1;
            setCurrentWordIndex(nextIndex);

            // Auto-scroll to keep current word visible
            setTimeout(() => {
                const currentWordElement = document.querySelector(`[data-word-index="${nextIndex}"]`);
                if (currentWordElement) {
                    currentWordElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 0);

            // Calculate accuracy
            const newTotalChars = totalChars + wordLength;
            const newCorrectChars = isCorrect ?
                correctChars + wordLength :
                correctChars +
                typedWord.split("").filter((char, i) => char === currentWord[i])
                .length;
            const acc =
                newTotalChars > 0 ? (newCorrectChars / newTotalChars) * 100 : 100;
            setAccuracy(Math.round(acc));

            // Calculate WPM
            const timeElapsed = (Date.now() - startTime) / 1000 / 60;
            const currentWpm =
                timeElapsed > 0 ?
                Math.round((completedWords.length + 1) / timeElapsed) :
                0;
            setWpm(currentWpm);
        }

        // Get the current word being typed (last word in the input)
        const currentTypingWord =
            value
            .split(" ")
            .filter((w) => w.length > 0)
            .pop() || "";

        // Check for wrong character and play beep
        const currentWord = words[currentWordIndex];
        if (currentTypingWord.length > 0) {
            const lastChar = currentTypingWord[currentTypingWord.length - 1];
            const expectedChar = currentWord[currentTypingWord.length - 1];

            if (
                currentTypingWord.length >
                (
                    currentInput
                    .split(" ")
                    .filter((w) => w.length > 0)
                    .pop() || ""
                ).length
            ) {
                if (lastChar !== expectedChar) {
                    playBeep();
                }
            }
        }

        setCurrentInput(value);
    };

    const getWordClass = (index) => {
        if (index < completedWords.length) {
            return completedWords[index].correct ? "text-green-600" : "text-red-600";
        }
        if (index === currentWordIndex) {
            // Get the current word being typed from the input
            const currentTypingWord =
                currentInput
                .split(" ")
                .filter((w) => w.length > 0)
                .pop() || "";
            const currentWord = words[index];
            const isCorrectSoFar = currentTypingWord
                .split("")
                .every((char, i) => char === currentWord[i]);
            return isCorrectSoFar ?
                "text-blue-600 underline decoration-2 underline-offset-4 font-bold" :
                "text-red-600 underline decoration-2 underline-offset-4 font-bold";
        }
        return "text-gray-400";
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handleTimeLimitChange = (seconds) => {
        if (!started) {
            setTimeLimit(seconds);
            setTimeLeft(seconds);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 md:mb-8">
                        <h1 className="text-2xl md:text-4xl font-bold text-indigo-600 flex items-center gap-2 md:gap-3">
                            <Trophy className="w-6 h-6 md:w-10 md:h-10" />
                            Typing Master
                        </h1>
                        <button
                            onClick={resetGame}
                            className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm md:text-base"
                        >
                            <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
                            Reset
                        </button>
                    </div>

                    {/* Main Layout: Left Sidebar + Center Content */}
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Left Sidebar - Stats (Hidden on mobile) */}
                        <div className="hidden md:block w-80 flex-shrink-0 space-y-4">
                            {/* Logo */}
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-xl shadow-lg text-center">
                                <Trophy className="w-16 h-16 mx-auto mb-2" />
                                <h2 className="text-2xl font-bold">Typing Master</h2>
                            </div>

                            {/* Timer Display */}
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-xl shadow-lg text-center">
                                <Clock className="w-10 h-10 mx-auto mb-2" />
                                <div className="text-sm opacity-90">Time Remaining</div>
                                <div className="text-5xl font-bold">
                                    {formatTime(timeLeft)}
                                </div>
                            </div>

                            {/* Speed */}
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                                <div className="text-sm opacity-90 mb-1">Speed</div>
                                <div className="text-4xl font-bold">{wpm}</div>
                                <div className="text-sm opacity-90">WPM</div>
                            </div>

                            {/* Accuracy */}
                            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                                <div className="text-sm opacity-90 mb-1">Accuracy</div>
                                <div className="text-4xl font-bold">{accuracy}%</div>
                                <div className="text-sm opacity-90">
                                    {errors} errors
                                </div>
                            </div>

                            {/* Words */}
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                                <div className="text-sm opacity-90 mb-1">Words</div>
                                <div className="text-4xl font-bold">
                                    {completedWords.length}
                                </div>
                                <div className="text-sm opacity-90">of {words.length}</div>
                            </div>
                        </div>

                        {/* Center Content - Typing Area */}
                        <div className="flex-1">
                            {/* Time Limit Selection */}
                            {!started && (
                                <div className="mb-4 md:mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 p-3 md:p-4 rounded-xl border-2 border-purple-200">
                                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2 md:mb-3">
                                        Select Time Duration:
                                    </label>
                                    <div className="flex gap-2 md:gap-3 flex-wrap">
                                        {[30, 60, 120, 180, 300].map((seconds) => (
                                            <button
                                                key={seconds}
                                                onClick={() => handleTimeLimitChange(seconds)}
                                                className={`px-4 md:px-6 py-2 rounded-lg font-semibold transition-all text-sm md:text-base ${
                                                    timeLimit === seconds
                                                        ? "bg-indigo-600 text-white shadow-lg scale-105"
                                                        : "bg-white text-gray-700 hover:bg-indigo-100 border-2 border-indigo-200"
                                                }`}
                                            >
                                                {seconds < 60 ? `${seconds}s` : `${seconds / 60}min`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Text Display */}
                            <div className="bg-gray-50 p-4 md:p-6 rounded-xl mb-4 md:mb-6 border-2 border-gray-200 h-[40vh] md:max-h-64 overflow-y-auto">
                                <p className="text-lg md:text-2xl leading-relaxed font-mono flex flex-wrap gap-x-2 md:gap-x-3 gap-y-1 md:gap-y-2">
                                    {words.map((word, index) => (
                                        <span
                                            key={index}
                                            data-word-index={index}
                                            className={`${getWordClass(
                                                index
                                            )} transition-colors whitespace-nowrap`}
                                        >
                                            {word}
                                        </span>
                                    ))}
                                </p>
                            </div>

                            {/* Input */}
                            <div className="mb-4 md:mb-6">
                                <textarea
                                    ref={inputRef}
                                    value={currentInput}
                                    onChange={handleInputChange}
                                    disabled={finished}
                                    placeholder="Start typing here to begin the test..."
                                    className="w-full p-3 md:p-4 text-lg md:text-xl border-2 border-indigo-300 rounded-xl focus:outline-none focus:border-indigo-500 font-mono resize-none disabled:bg-gray-100 disabled:cursor-not-allowed h-[40vh] md:h-auto"
                                    rows="5"
                                    autoFocus
                                />
                                <p className="text-xs md:text-sm text-gray-500 mt-2">
                                    💡 Type the word and press{" "}
                                    <kbd className="px-2 py-1 bg-gray-200 rounded">
                                        Space
                                    </kbd>{" "}
                                    to move to the next word
                                </p>
                            </div>

                            {/* Finish Message */}
                            {finished && (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 md:p-6 text-center">
                                    <h2 className="text-2xl md:text-3xl font-bold text-green-700 mb-3 md:mb-4">
                                        ⏰ Time's Up!
                                    </h2>
                                    <div className="text-base md:text-lg text-gray-700 mb-3 md:mb-4">
                                        <p className="mb-2">
                                            <span className="font-bold text-green-600 text-xl md:text-2xl">
                                                {wpm} WPM
                                            </span>
                                        </p>
                                        <p className="mb-2">
                                            <span className="font-bold text-green-600 text-xl md:text-2xl">
                                                {accuracy}% Accuracy
                                            </span>
                                        </p>
                                        <p className="text-gray-600">
                                            You typed{" "}
                                            <span className="font-bold">
                                                {completedWords.length}
                                            </span>{" "}
                                            words with <span className="font-bold">{errors}</span>{" "}
                                            errors
                                        </p>
                                    </div>
                                    <button
                                        onClick={resetGame}
                                        className="mt-3 md:mt-4 px-5 md:px-6 py-2 md:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm md:text-base"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}

                            {/* Instructions */}
                            {!started && (
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 md:p-4 text-center">
                                    <p className="text-gray-700 text-sm md:text-base">
                                        💡 <span className="font-semibold">Tip:</span> Select your
                                        preferred time duration, then start typing. Type each word and press Space to move to the next one. You'll hear a beep
                                        when you type a wrong character!
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}