
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Clock, Image, Video, MessageSquare } from "lucide-react";
import { JourneyMessage, PipelineStage } from "./types";

interface JourneyKanbanProps {
  pipelineStages: PipelineStage[];
  messages: JourneyMessage[];
  handleDragStart: (e: React.DragEvent, messageId: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, targetStage: string) => void;
  handleEdit: (message: JourneyMessage) => void;
  handleDelete: (messageId: string) => void;
}

const getMessagesByStage = (messages: JourneyMessage[], stageId: string) => {
  return messages.filter(m => m.stage === stageId).sort((a, b) => a.order - b.order);
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "image":
      return <Image className="w-4 h-4" />;
    case "video":
      return <Video className="w-4 h-4" />;
    default:
      return <MessageSquare className="w-4 h-4" />;
  }
};

const getDelayText = (delay: number, unit: "minutes" | "hours" | "days") => {
  const unitMap = {
    minutes: "minuto(s)",
    hours: "hora(s)",
    days: "dia(s)",
  };
  return `${delay} ${unitMap[unit]} após entrada`;
};

export default function JourneyKanban({
  pipelineStages,
  messages,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleEdit,
  handleDelete,
}: JourneyKanbanProps) {
  return (
    <div className="relative bg-slate-50 flex-1 w-full">
      <div className="overflow-x-auto">
        <div className="flex gap-6 px-4 md:px-10 py-6 max-w-full md:max-w-[92vw] 2xl:max-w-[1400px] mx-auto min-h-[70vh]">
          {pipelineStages.map((stage) => (
            <Card
              key={stage.id}
              className="w-80 flex-shrink-0 transition-shadow shadow-md hover:shadow-lg border border-slate-200 bg-white"
            >
              <CardHeader>
                <CardTitle>{stage.name}</CardTitle>
              </CardHeader>
              <CardContent
                className="space-y-2 p-2"
                onDragOver={(e) => handleDragOver(e)}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {getMessagesByStage(messages, stage.id).map((message) => (
                  <div
                    key={message.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, message.id)}
                    className="bg-slate-50 rounded p-2 shadow-sm border flex items-center justify-between mb-2 transition-transform hover:scale-[1.02]"
                  >
                    <div>
                      <div className="font-semibold text-sm">{message.title}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getDelayText(message.delay, message.delayUnit)}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline">{getTypeIcon(message.type)}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(message)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(message.id)}
                        className="text-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {getMessagesByStage(messages, stage.id).length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">Nenhuma mensagem neste estágio</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
