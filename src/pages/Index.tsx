
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [inputLanguage, setInputLanguage] = useState('nl-NL');
  const [outputLanguage, setOutputLanguage] = useState('nl');
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const inputLanguages = [
    { code: 'nl-NL', name: 'Nederlands' },
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'de-DE', name: 'Deutsch' },
    { code: 'fr-FR', name: 'Français' },
    { code: 'es-ES', name: 'Español' },
    { code: 'it-IT', name: 'Italiano' },
  ];

  const outputLanguages = [
    { code: 'nl', name: 'Nederlands' },
    { code: 'en', name: 'English' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'it', name: 'Italiano' },
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      toast({
        title: "Opname gestart",
        description: `Spreek nu in het ${inputLanguages.find(lang => lang.code === inputLanguage)?.name}`,
      });
    } catch (error) {
      console.error('Error starting recording:', error);
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
      setIsRecording(false);
      setIsTranscribing(true);
      
      toast({
        title: "Opname gestopt",
        description: "Audio wordt nu getranscribeerd...",
      });
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      // Hier zou je normaal een transcriptie API aanroepen
      // Voor nu simuleren we een transcriptie
      setTimeout(() => {
        const mockTranscript = "Dit is een voorbeeldtranscriptie van het opgenomen gesprek.";
        setTranscript(mockTranscript);
        setIsTranscribing(false);
        
        toast({
          title: "Transcriptie voltooid",
          description: "Het gesprek is succesvol getranscribeerd",
        });
      }, 2000);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setIsTranscribing(false);
      toast({
        title: "Transcriptiefout",
        description: "Er is een fout opgetreden bij het transcriberen",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Taalkeuze & Opname</h1>
            <p className="text-gray-600 text-sm">Kies je taal en neem een gesprek op</p>
          </div>

          {/* Input Language Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Spreektaal (Invoer)</label>
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
            <label className="text-sm font-medium text-gray-700">Transcriptietaal (Uitvoer)</label>
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
          <div className="flex justify-center py-4">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                size="lg"
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-200 shadow-lg"
                disabled={isTranscribing}
              >
                <Mic className="w-8 h-8 text-white" />
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                size="lg"
                className="w-20 h-20 rounded-full bg-gray-500 hover:bg-gray-600 transition-all duration-200 shadow-lg animate-pulse"
              >
                <Square className="w-6 h-6 text-white" />
              </Button>
            )}
          </div>

          {/* Recording Status */}
          {isRecording && (
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-600 font-medium">Opname actief...</span>
              </div>
            </div>
          )}

          {isTranscribing && (
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-blue-600 font-medium">Transcriberen...</span>
              </div>
            </div>
          )}

          {/* Transcript Output */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Transcriptie</label>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="De transcriptie verschijnt hier na de opname..."
              className="min-h-[120px] resize-none"
            />
          </div>

          {/* Clear Button */}
          {transcript && (
            <Button
              onClick={() => setTranscript('')}
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
