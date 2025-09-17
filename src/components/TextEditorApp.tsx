import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useMachine } from '@xstate/react';
import { EditorState } from 'prosemirror-state';
import { editorMachine } from '../editorMachine';
import { ProseMirrorEditor, type ProseMirrorEditorRef } from './ProseMirrorEditor';
import { motion } from 'motion/react';

export const TextEditorApp: React.FC = () => {
	const [state, send] = useMachine(editorMachine);
	const [hover, setHover] = useState(false);
	const [cursorPosition, setCursorPosition] = useState<{ left: number; top: number } | null>(null);
	const editorRef = useRef<ProseMirrorEditorRef>(null);

	const handleEditorCreated = useCallback((editorState: EditorState) => {
		console.log('Editor created with state:', editorState);
		send({ type: 'EDITOR_CREATED', editorState });
	}, [send]);

	const handleEditorUpdate = useCallback((editorState: EditorState) => {
		send({ type: 'EDITOR_UPDATED', editorState });
		// Update cursor position
		if (editorRef.current) {
			const position = editorRef.current.getCursorPosition();
			setCursorPosition(position);
		}
	}, [send]);

	const handleContinueWriting = useCallback(() => {
		console.log('Continue Writing clicked! Current state:', state.value);
		console.log('Current text:', state.context.currentText);
		send({ type: 'CONTINUE_WRITING' });
	}, [send, state]);

	/**
	 * WATCHING FOR GENERATED TEXT
	 * This useEffect watches the generatedText in the state machine context
	 * When it changes (becomes non-null), we insert it into the editor with streaming effect
	 */
	useEffect(() => {
		const generatedText = state.context.generatedText;
		if (generatedText && editorRef.current) {
			console.log('Inserting generated text with streaming effect:', generatedText);
			editorRef.current.insertText(generatedText, true);
			// Tell the machine we've inserted the text
			send({ type: 'TEXT_INSERTED' });
		}
	}, [state.context.generatedText, send]);

	// if there's text and we're not currently generating
	const canContinue = state.context.currentText.trim().length > 0 && !state.context.isLoading;
	const isGenerating = state.matches('generating');
	const hasError = state.matches('error');

	const firstSpanVariants = {
		initial: {
			y: 0,
			opacity: 1,
		},
		hover: {
			y: -20,
			opacity: 0
		}
	}

	const secondSpanVariants = {
		initial: {
			y: 20,
			opacity: 0,
		},
		hover: {
			y: 0,
			opacity: 1
		}
	}

	return (
		<div className='text-white w-full'>
			{/* Header */}
			<div className='my-12 text-center'>
				<h1 className='text-7xl font-bold mb-2 leading-tighter tracking-tighter'>
					AI Writing Assistant
				</h1>
				<p>
					Start writing and let AI help you continue your thoughts
				</p>
			</div>

			<div className='mb-6 relative w-2/3 mx-auto'>
				<ProseMirrorEditor
					ref={editorRef}
					onEditorCreated={handleEditorCreated}
					onEditorUpdate={handleEditorUpdate}
					placeholder="Start writing your story, article, or any text..."
				/>
				{state.context.isLoading && cursorPosition && (
					<div 
						className='text-white/50 flex items-center gap-1 pointer-events-none'
						style={{
							position: 'absolute',
							left: cursorPosition.left + 14 + 'px',
							top: cursorPosition.top - 14 + 'px',
						}}
					>
						<div className='flex text-3xl'>
							<span className='animate-pulse'>.</span>
							<span className='animate-pulse' style={{animationDelay: '0.2s'}}>.</span>
							<span className='animate-pulse' style={{animationDelay: '0.4s'}}>.</span>
						</div>
					</div>
				)}
				<div className='text-white/50 absolute m-1 text-xs right-2 bottom-2'>
					{state.context.currentText.length} characters
				</div>
			</div>

			<div className='flex items-center gap-4 justify-center relative py-16'>
				<motion.button
					onClick={handleContinueWriting}
					disabled={!canContinue}
					className={`${canContinue ? 'bg-white' : 'bg-white/50'} text-black px-4 py-2 w-40 h-14
          				whitespace-nowrap font-medium transition-all duration-300 tracking-tight relative flex items-center justify-center`}
					whileHover="hover"
					onHoverStart={() => setHover(true)}
					onHoverEnd={() => setHover(false)}
					initial="initial"
					variants={{
						initial: {},
						hover: {}
					}}
				>
					<motion.span
						initial={{ scaleX: 1.5 }}
						animate={hover ? { scaleX: 2.5 } : { scaleX: 1.5 }}
						transition={{ duration: 0.2, ease: 'linear' }}
						className='absolute h-[1px] w-full top-0 left-0 origin-left bg-gradient-to-r from-white to-transparent'
					/>
					<motion.span
						initial={{ scaleY: 1.5 }}
						animate={hover ? { scaleY: 2.5 } : { scaleY: 1.5 }}
						transition={{ duration: 0.2, ease: 'linear' }}
						className='absolute w-[1px] h-full bottom-0 right-0 origin-bottom bg-gradient-to-t from-white to-transparent'
					/>
					<motion.span
						initial={{ scaleX: 1.5 }}
						animate={hover ? { scaleX: 2.5 } : { scaleX: 1.5 }}
						transition={{ duration: 0.2, ease: 'linear' }}
						className='absolute h-[1px] w-full bottom-0 right-0 origin-right bg-gradient-to-l from-white to-transparent'
					/>
					<motion.span
						initial={{ scaleY: 1.5 }}
						animate={hover ? { scaleY: 2.5 } : { scaleY: 1.5 }}
						transition={{ duration: 0.2, ease: 'linear' }}
						className='absolute w-[1px] h-full bottom-0 left-0 origin-top bg-gradient-to-b from-white to-transparent'
					/>
					<motion.span
						variants={firstSpanVariants}
						className="absolute w-full flex items-center justify-center gap-2"
					>
						{isGenerating && (
							<div className='w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin' />
						)}
						{isGenerating ? 'Generating...' : 'Continue Writing'}
					</motion.span>
					<motion.span
						variants={secondSpanVariants}
						className="absolute w-full flex items-center justify-center gap-2"
					>
						{isGenerating && (
							<div className='w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin' />
						)}
						{isGenerating ? 'Generating...' : 'Continue Writing'}
					</motion.span>
				</motion.button>
			</div>

			{hasError && (
				<div className='bg-red-100 text-red-800 rounded-md px-4 py-2'>
					<strong>Error:</strong> {state.context.error?.toString()}
				</div>
			)}
		</div>
	);
};
