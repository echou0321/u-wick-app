import { useState, useCallback, useRef } from 'react';
import { ChatMessage, FlowMode, ScriptStep } from '@/types';
import {
  PLANNING_SCRIPT,
  PROACTIVE_SCRIPT,
  PLANNING_ADVANCE_MAP,
  PROACTIVE_ADVANCE_MAP,
} from '@/data/chat-scripts';
import { matchIntent } from '@/data/mock-responses';
import { STUDY_BLOCKS } from '@/data/mock-state';
import { useAppContext } from '@/context/AppContext';

let msgCounter = 0;
function makeId() {
  return `msg_${++msgCounter}`;
}

function scriptStepToMessage(step: ScriptStep): ChatMessage {
  return {
    id: makeId(),
    role: step.role,
    text: step.text,
    quickReplies: step.quickReplies,
    showUpload: step.showUpload,
    showCanvas: step.showCanvas,
    showSchedulePreview: step.showSchedulePreview,
    showNotifPreview: step.showNotifPreview,
    showStatusCard: step.showStatusCard,
    showChecklist: step.showChecklist,
    showDeadlineAdded: step.showDeadlineAdded,
    isProactive: step.isProactive,
    isUpload: step.isUpload,
    isCanvas: step.isCanvas,
  };
}

interface UseChatEngineResult {
  messages: ChatMessage[];
  isTyping: boolean;
  sendMessage: (text: string) => void;
  handleQuickReply: (reply: string) => void;
}

const TYPING_DELAY_MS = 1100;

export function useChatEngine(flow: FlowMode): UseChatEngineResult {
  const script = flow === 'planning' ? PLANNING_SCRIPT : PROACTIVE_SCRIPT;
  const advanceMap = flow === 'planning' ? PLANNING_ADVANCE_MAP : PROACTIVE_ADVANCE_MAP;

  const { addStudyBlocks, setNotifActive, setDeadlineAdded } = useAppContext();

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    scriptStepToMessage(script[0]),
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scriptIndexRef = useRef<number>(0);

  const applyBotSideEffects = useCallback(
    (step: ScriptStep) => {
      if (step.showSchedulePreview === 'info200') {
        addStudyBlocks(STUDY_BLOCKS.slice(0, 2)); // Mon/Wed INFO 200 blocks
      }
      if (step.showSchedulePreview === 'math207') {
        addStudyBlocks(STUDY_BLOCKS.slice(2)); // Sat/Sun MATH 207 blocks
      }
      if (step.showNotifPreview) {
        setNotifActive(true);
      }
      if (step.showDeadlineAdded) {
        setDeadlineAdded(true);
      }
    },
    [addStudyBlocks, setNotifActive, setDeadlineAdded]
  );

  const pushBotMessage = useCallback(
    (stepId: number) => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const step = script[stepId];
        if (!step) return;
        scriptIndexRef.current = stepId;
        applyBotSideEffects(step);
        setMessages((prev) => [...prev, scriptStepToMessage(step)]);
      }, TYPING_DELAY_MS);
    },
    [script, applyBotSideEffects]
  );

  const handleQuickReply = useCallback(
    (reply: string) => {
      if (reply === 'Undo') {
        const undoMsg: ChatMessage = {
          id: makeId(),
          role: 'user',
          text: '↩ Undo',
        };
        setMessages((prev) => [...prev, undoMsg]);
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const undoResponseMsg: ChatMessage = {
            id: makeId(),
            role: 'assistant',
            text: "No problem! I've removed that block. Want to try a different time?",
            quickReplies: ['Try a different time', 'Skip for now'],
          };
          setMessages((prev) => [...prev, undoResponseMsg]);
        }, TYPING_DELAY_MS);
        return;
      }

      const currentIndex = scriptIndexRef.current;
      const nextUserStepId = advanceMap[currentIndex];

      if (nextUserStepId !== undefined) {
        const userStep = script[nextUserStepId];
        if (!userStep) return;
        const userMsg = scriptStepToMessage(userStep);
        setMessages((prev) => [...prev, userMsg]);
        if (userStep.next !== undefined) {
          pushBotMessage(userStep.next);
        }
      } else {
        // End of scripted flow — append as a plain user message
        const userMsg: ChatMessage = {
          id: makeId(),
          role: 'user',
          text: reply,
        };
        setMessages((prev) => [...prev, userMsg]);
        // Respond with pattern matching
        const response = matchIntent(reply);
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            { id: makeId(), role: 'assistant', text: response },
          ]);
        }, TYPING_DELAY_MS);
      }
    },
    [advanceMap, script, pushBotMessage]
  );

  const sendMessage = useCallback(
    (text: string) => {
      const userMsg: ChatMessage = { id: makeId(), role: 'user', text };
      setMessages((prev) => [...prev, userMsg]);

      const response = matchIntent(text);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: makeId(), role: 'assistant', text: response },
        ]);
      }, TYPING_DELAY_MS);
    },
    []
  );

  return { messages, isTyping, sendMessage, handleQuickReply };
}
