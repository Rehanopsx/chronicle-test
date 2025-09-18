import { useCallback, useEffect, useRef } from 'react';
import { useMachine } from '@xstate/react';
import { EditorState } from 'prosemirror-state';
import { editorMachine } from '../editorMachine';
import type { ProseMirrorEditorRef } from '../components/ProseMirrorEditor';

export const useEditorState = () => {
  const [state, send] = useMachine(editorMachine);
  const editorRef = useRef<ProseMirrorEditorRef>(null);

  const canContinue = state.context.currentText.trim().length > 0 && !state.context.isLoading;
  const isGenerating = state.matches('generating');
  const hasError = state.matches('error');
  const isLoading = state.context.isLoading;
  const generatedText = state.context.generatedText;
  const currentText = state.context.currentText;
  const error = state.context.error;

  const handleEditorCreated = useCallback((editorState: EditorState) => {
    send({ type: 'EDITOR_CREATED', editorState });
  }, [send]);

  const handleEditorUpdate = useCallback((editorState: EditorState) => {
    send({ type: 'EDITOR_UPDATED', editorState });
  }, [send]);

  const handleContinueWriting = useCallback(() => {
    send({ type: 'CONTINUE_WRITING' });
  }, [send]);

  useEffect(() => {
    if (generatedText && editorRef.current) {
      editorRef.current.insertText(generatedText, true);
      send({ type: 'TEXT_INSERTED' });
    }
  }, [generatedText]);

  return {
    // State
    canContinue,
    isGenerating,
    hasError,
    isLoading,
    currentText,
    error,
    
    // Actions
    handleEditorCreated,
    handleEditorUpdate,
    handleContinueWriting,
    
    // Refs
    editorRef,
  };
};
