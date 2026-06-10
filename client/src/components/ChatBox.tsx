import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, MessageCircle, Loader2, Mic, Square, Play, Pause } from "lucide-react";

interface ChatBoxProps {
  rideId: number;
  senderRole: "driver" | "passenger";
  currentUserId: number;
}

export default function ChatBox({ rideId, senderRole, currentUserId }: ChatBoxProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: messages, isLoading, refetch } = trpc.chat.getMessages.useQuery(
    { rideId },
    {
      refetchInterval: 3000, // Poll every 3 seconds for new messages
    }
  );

  const uploadAudio = trpc.upload.uploadDocument.useMutation();

  const sendMessage = trpc.chat.send.useMutation({
    onSuccess: () => {
      setMessage("");
      setAudioBlob(null);
      refetch();
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar mensagem");
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessage.mutate({
      rideId,
      message: message.trim(),
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error("Erro ao acessar microfone");
      console.error(error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const sendAudio = async () => {
    if (!audioBlob) return;

    try {
      toast.info("Enviando áudio...");

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        
        // Upload audio
        const uploadResult = await uploadAudio.mutateAsync({
          fileData: base64Audio,
          fileName: `audio-${Date.now()}.webm`,
          fileType: "audio/webm",
        });

        // Send message with audio URL
        await sendMessage.mutateAsync({
          rideId,
          audioUrl: uploadResult.url,
        });

        setAudioBlob(null);
        setRecordingTime(0);
        toast.success("Áudio enviado!");
      };
    } catch (error) {
      toast.error("Erro ao enviar áudio");
      console.error(error);
    }
  };

  const cancelAudio = () => {
    setAudioBlob(null);
    setRecordingTime(0);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current && messages) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Chat com {senderRole === "driver" ? "Passageiro" : "Motorista"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages Area */}
        <ScrollArea className="h-[300px] w-full rounded-md border p-4" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isOwnMessage = msg.senderId === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {msg.audioUrl ? (
                        <AudioPlayer audioUrl={msg.audioUrl} />
                      ) : (
                        <p className="text-sm">{msg.message}</p>
                      )}
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Nenhuma mensagem ainda. Inicie a conversa!</p>
            </div>
          )}
        </ScrollArea>

        {/* Audio Recording UI */}
        {audioBlob && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Play className="w-4 h-4" />
            <span className="text-sm flex-1">Áudio gravado ({formatTime(recordingTime)})</span>
            <Button size="sm" onClick={sendAudio} disabled={sendMessage.isPending}>
              Enviar
            </Button>
            <Button size="sm" variant="outline" onClick={cancelAudio}>
              Cancelar
            </Button>
          </div>
        )}

        {isRecording && (
          <div className="flex items-center gap-2 p-3 bg-red-900/30 rounded-lg">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
            <span className="text-sm flex-1">Gravando... {formatTime(recordingTime)}</span>
            <Button size="sm" variant="destructive" onClick={stopRecording}>
              <Square className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Input Area */}
        {!audioBlob && !isRecording && (
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={sendMessage.isPending}
            />
            <Button
              type="button"
              variant="outline"
              onClick={startRecording}
              disabled={sendMessage.isPending}
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button type="submit" disabled={sendMessage.isPending || !message.trim()}>
              {sendMessage.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// Audio Player Component
function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={togglePlay}
        className="h-8 w-8 p-0"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>
      <span className="text-xs">Mensagem de áudio</span>
    </div>
  );
}
