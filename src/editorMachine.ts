import { createMachine, assign, fromPromise } from 'xstate';
import { EditorState } from 'prosemirror-state';
import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"

export interface EditorContext {
	editorState: EditorState | null;  
	isLoading: boolean;               
	error: string | null;             
	currentText: string;              
	generatedText: string | null;     
}

export type EditorEvent =
	| { type: 'EDITOR_CREATED'; editorState: EditorState }
	| { type: 'EDITOR_UPDATED'; editorState: EditorState }
	| { type: 'CONTINUE_WRITING' }                        
	| { type: 'TEXT_INSERTED' }                                                         

const continueWritingActor = fromPromise(async ({ input }: { input: { text: string } }) => {
	// console.log('continueWritingActor input:', input);
	const apiKey = import.meta.env.VITE_GROQ_API_KEY;
	
	// Create a prompt for continuing the writing
	const prompt = `
	You are a helpful writing assistant. Continue the following text in a natural, coherent way. 
	Write 1-3 sentences that flow naturally from the existing content. Do not repeat what's already written.
	Existing text: "${input.text}" Continue writing from where it left off:`
	
	try {
		if (apiKey) {
			throw new Error('GROQ_API_KEY environment variable is not set, using mock ai responses!');
		}

		const groq = createGroq({
			apiKey,
		})

		const { text } = await generateText({
			model: groq("openai/gpt-oss-120b"),
			prompt,
			temperature: 0.7
		})

		return text.trim()
	} catch (error) {
		console.error("Unexpected error occurred while generating text", error);
		// if errored, simulate real ai api call with network delay
		await new Promise(resolve => setTimeout(resolve, 2000));

		// Mock AI responses
		const continuations = [
			" The journey ahead was filled with uncertainty, but there was something liberating about stepping into the unknown.",
			" As the sun began to set, the colors painted across the sky reminded me of childhood summers and forgotten dreams.",
			" Technology has transformed the way we communicate, yet somehow we seem more disconnected than ever before.",
			" The old library held secrets between its weathered pages, stories waiting to be discovered by curious minds.",
			" In that moment of silence, everything became clear - the path forward was not about avoiding obstacles, but embracing them."
		];

		return continuations[Math.floor(Math.random() * continuations.length)];
	}
});

export const editorMachine = createMachine(
	{
		id: 'editor',
		initial: 'idle',
		context: {
			editorState: null,
			isLoading: false,
			error: null,
			currentText: '',
			generatedText: null,
		} as EditorContext,
		states: {
			idle: {
				on: {
					EDITOR_CREATED: {
						actions: assign({
							editorState: ({ event }) => event.editorState,
							currentText: ({ event }) => event.editorState.doc.textContent,
						}),
					},

					EDITOR_UPDATED: {
						actions: assign({
							editorState: ({ event }) => event.editorState,
							currentText: ({ event }) => event.editorState.doc.textContent,
						}),
					},

					CONTINUE_WRITING: {
						target: 'generating',
						guard: ({ context }) => {
							// Only allow transition if there's actual text content (not just whitespace)
							return context.currentText.trim().length > 0;
						},
					},

					TEXT_INSERTED: {
						actions: assign({
							generatedText: null,
						}),
					},
				},
			},

			generating: {
				entry: assign({
					isLoading: true,
					error: null,
				}),

				invoke: {
					id: 'continueWriting',
					src: 'continueWritingActor',
					input: ({ context }) => ({
						text: context.currentText
					}),

					onDone: {
						target: 'idle',
						actions: [
							assign({
								isLoading: false,
								generatedText: ({ event }) => {
									console.log('AI generated text successfully:', event.output);
									return event.output;
								}
							})
						],
					},

					onError: {
						target: 'error',
						actions: assign({
							isLoading: false,
							error: ({ event }) => {
								console.log('AI generated text failed:', event.error);
								return event.error as string;
							},
						}),
					},
				},
			},

			error: {
				on: {
					EDITOR_UPDATED: {
						target: 'idle',
						actions: assign({
							editorState: ({ event }) => event.editorState,
							currentText: ({ event }) => event.editorState.doc.textContent,
							error: null,
						}),
					},
				},
			},
		},
	},
	{
		actors: {
			continueWritingActor,
		},
	}
);
