import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [inputLanguage, setInputLanguage] = useState("nl-NL");
  const [outputLanguage, setOutputLanguage] = useState("nl");
  const [transcript, setTranscript] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const inputLanguages = [
    { code: "nl-NL", name: "Nederlands" },
    { code: "en-US", name: "English (US)" },
    { code: "en-GB", name: "English (UK)" },
    { code: "de-DE", name: "Deutsch" },
    { code: "fr-FR", name: "Français" },
    { code: "es-ES", name: "Español" },
    { code: "it-IT", name: "Italiano" },
  ];

  const outputLanguages = [
    { code: "nl", name: "Nederlands" },
    { code: "en", name: "English" },
    { code: "de", name: "Deutsch" },
    { code: "fr", name: "Français" },
    { code: "es", name: "Español" },
    { code: "it", name: "Italiano" },
  ];

  // Timer effect for recording
  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // Translation effect
  useEffect(() => {
    if (transcript && transcript.trim() !== "") {
      translateText(transcript);
    }
  }, [transcript, outputLanguage]);

  const translateText = async (text: string) => {
    if (!text.trim()) return;

    try {
      // Using a free translation API (MyMemory)
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          text
        )}&langpair=${inputLanguage.split("-")[0]}|${outputLanguage}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.responseData && data.responseData.translatedText) {
          setTranslatedText(data.responseData.translatedText);
        }
      } else {
        // Fallback: show original text if translation fails
        setTranslatedText(text);
      }
    } catch (error) {
      console.error("Translation error:", error);
      // Fallback: show original text if translation fails
      setTranslatedText(text);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start Web Speech API recognition
      if (
        "webkitSpeechRecognition" in window ||
        "SpeechRecognition" in window
      ) {
        const SpeechRecognition =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = inputLanguage;
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = "";
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          setTranscript(finalTranscript + interimTranscript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          toast({
            title: "Spraakherkenning fout",
            description: "Er is een probleem met de spraakherkenning",
            variant: "destructive",
          });
        };

        recognitionRef.current.start();
      }

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        // Stop speech recognition
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      toast({
        title: "Opname gestart",
        description: `Spreek nu in het ${
          inputLanguages.find((lang) => lang.code === inputLanguage)?.name
        }`,
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Fout",
        description: "Kan geen toegang krijgen tot de microfoon",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();

      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      setIsRecording(false);

      toast({
        title: "Opname gestopt",
        description: "Spraakherkenning voltooid",
      });
    }
  };

  const handleRecordingToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Vertaal applicatie
            </h1>
            <p className="text-gray-600 text-sm">
              Kies je taal en neem een gesprek op
            </p>
          </div>

          {/* Input Language Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Spreektaal (Invoer)
            </label>
            <Select value={inputLanguage} onValueChange={setInputLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecteer spreektaal" />
              </SelectTrigger>
              <SelectContent>
                {inputLanguages.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    {language.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Output Language Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Transcriptietaal (Uitvoer)
            </label>
            <Select value={outputLanguage} onValueChange={setOutputLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecteer uitvoertaal" />
              </SelectTrigger>
              <SelectContent>
                {outputLanguages.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    {language.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recording Button */}
          <div className="flex flex-col items-center py-4 space-y-4">
            <Button
              onClick={handleRecordingToggle}
              size="lg"
              className={`w-20 h-20 rounded-full transition-all duration-200 shadow-lg font-poppins font-medium ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
              disabled={isTranscribing}
            >
              {isRecording ? (
                <Square className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </Button>

            {/* Recording time display */}
            {isRecording && (
              <div className="text-center">
                <p className="text-lg font-poppins font-semibold text-red-600">
                  {formatTime(recordingTime)}
                </p>
              </div>
            )}
          </div>

          {/* Status Message */}
          <div className="text-center">
            {isRecording ? (
              <p className="text-red-600 font-medium">Er wordt opgenomen...</p>
            ) : isTranscribing ? (
              <p className="text-blue-600 font-medium">Transcriberen...</p>
            ) : (
              <p className="text-gray-600 font-poppins font-medium">Opnemen</p>
            )}
          </div>

          {/* Original Transcript */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Originele Transcriptie (
              {inputLanguages.find((lang) => lang.code === inputLanguage)?.name}
              )
            </label>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="De originele transcriptie verschijnt hier na de opname..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Translated Output */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Vertaalde Uitvoer (
              {
                outputLanguages.find((lang) => lang.code === outputLanguage)
                  ?.name
              }
              )
            </label>
            <Textarea
              value={translatedText}
              onChange={(e) => setTranslatedText(e.target.value)}
              placeholder="De vertaalde tekst verschijnt hier automatisch..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Clear Button */}
          {(transcript || translatedText) && (
            <Button
              onClick={() => {
                setTranscript("");
                setTranslatedText("");
              }}
              variant="outline"
              className="w-full"
            >
              Wissen
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
