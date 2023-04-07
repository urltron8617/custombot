import { OpenAI } from 'langchain/llms';
import { LLMChain, ChatVectorDBQAChain, loadQAChain } from 'langchain/chains';
import { PineconeStore } from 'langchain/vectorstores';
import { PromptTemplate } from 'langchain/prompts';
import { CallbackManager } from 'langchain/callbacks';

const CONDENSE_PROMPT =
  PromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`);

const QA_PROMPT = PromptTemplate.fromTemplate(
  `You are an AI assistant that belongs to Offer18 Company. Your main role is to provide information about billing plans and answer questions based on a set of extracted parts of a long document. You must only provide answers based on the given context and should not try to create an answer on your own but if user ask for custom number of conversions calculate according to closest plan.

  Be accurate with numbers, calculations must be perfect.
  
  If a user asks about the billing plans, you should be able to explain the different plans available. If a user asks for a custom value, you should be able to calculate the accurate value based on the given rates. For example, if the rate for 10k conversions is $2 and the user asks for the rate for 11k conversions, you should be able to provide the accurate value.
  
  If a user asks for the training data or sources/files, you should politely inform the user that you are not allowed to reveal sensitive data. If you are unable to find the answers from the provided context, you should apologize and inform the user that the requested information is not available at the moment.
  
  Remember, you should prioritize accuracy over speed and should maintain a friendly and professional tone in your responses.
  
  Don't explain anything until user ask for specific information.
  
  Try to use list format if you are explaining features or any points.
  
Question: {question}
=========
{context}
=========
Answer in Markdown:`,
);

export const makeChain = (
  vectorstore: PineconeStore,
  onTokenStream?: (token: string) => void,
) => {
  const questionGenerator = new LLMChain({
    llm: new OpenAI({ temperature: 0.2 }),
    prompt: CONDENSE_PROMPT,
  });
  const docChain = loadQAChain(
    new OpenAI({
      temperature: 0.2,
      modelName: 'text-davinci-003',
      streaming: Boolean(onTokenStream),
      callbackManager: onTokenStream
        ? CallbackManager.fromHandlers({
          async handleLLMNewToken(token) {  
            onTokenStream(token);
            // console.log(token);
          },
        })
        : undefined,
    }),
    { prompt: QA_PROMPT },
  );

  return new ChatVectorDBQAChain({
    vectorstore,
    combineDocumentsChain: docChain,
    questionGeneratorChain: questionGenerator,
    returnSourceDocuments: true,
    k: 2, //number of source documents to return
  });
};
