/* eslint-disable prettier/prettier */
import { HttpException, Injectable } from '@nestjs/common';
import { OpenAIApi, Configuration } from 'openai';

import {GoogleCustomSearch} from 'langchain/tools'
import { PineconeClient } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { DynamicTool } from "langchain/tools";
import * as dotenv from 'dotenv';
import { Readable } from 'stream';
import { PineconeStore } from 'langchain/vectorstores';

dotenv.config();



const functions = [
  {
    name: 'answer_question',
    description:
      'Call this function for most of questions related to car management and applying for a driving license in Kazakhstan',
    parameters: {
      type: 'object',
      properties: {
        user_input: {
          type: 'string',
          description: "User's input",
        },
      },
      required: ['user_input'],
    },
  },
  {
    name: 'pdd_search',
    description:
      'Call this function to answer questions related to traffic rules and definitions of the Republic of Kazakhstan',
    parameters: {
      type: 'object',
      properties: {
        text_for_search: {
          type: 'string',
          description:
            'Text that will be used for search in the vector database of traffic rules of the Republic of Kazakhstan',
        },
      },
      required: ['text_for_search'],
    },
  },
];

@Injectable()
export class InspectorService {
  
  public messages: any = [
    {
      "role": "system",
      "name": "undefined",
      
      "content":
        "You are a traffic police inspector of Kazakhstan and you help users to find out information about the current situation of traffic rules. Answer only questions related to traffic rules, cars, and applying for a driver's license. Otherwise, say that you cannot answer these questions",
    },
  ];


openai: OpenAIApi;

    constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
    const pinecone = new PineconeClient()
    pinecone.init({
        environment: process.env.PINECONE_ENV,
        apiKey: process.env.PINECONE_API_KEY
    })
  }

  public async answer_question(user_input: string): Promise<string> {
    const search = new GoogleCustomSearch({apiKey: process.env.GOOGLE_API_KEY, googleCSEId:  process.env.GOOGLE_CSE_ID});
    const tool = new DynamicTool({
        name: "Answer questions related to traffic rules",
        description:
          "Search information about how to apply for driver's license only in Kazakhstan and driving moments",
        func: async () => search._call(user_input)
      })
    const res =
      'USE THIS INFORMATION TO ANSWER: ' + (await tool._call(user_input));
    return res;
  }

  public async pdd_search(text_for_search: string): Promise<string> {
    const pinecone = new PineconeClient()
    await pinecone.init({
        environment: process.env.PINECONE_ENV,
        apiKey: process.env.PINECONE_API_KEY
    })
    console.log(text_for_search, 'text');
    const embedding = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
    });
    const index = pinecone.Index('inspector-db')
    const pineconeStore = new PineconeStore(embedding, { pineconeIndex: index});


    if (text_for_search !== '') {
      console.log(pineconeStore)
      const docs = await pineconeStore.similaritySearch(text_for_search, 1)
      console.log(docs)
      return 'USE ONLY THIS INFORMATION TO ANSWER: ' + JSON.stringify(docs);
    } else {
      return 'USE YOUR OWN KNOWLEDGE TO ANSWER THIS QUESTION';
    }
  }

  async generateResponse(user_prompt: string): Promise<any>{
    console.log(user_prompt);

    const messages = this.messages
    messages.push({
      role: 'user',
      content: user_prompt,
      name: undefined
    });
    console.log(messages)

    try {
        console.log('start')
        const response = await this.openai.createChatCompletion(
          {
            model: "gpt-3.5-turbo",
            messages: messages,
            functions: functions,
            function_call: 'auto'
          },
          
   
        );

        console.log(response, 'response');

        console.log(response.data['choices'][0]['message']);
  
        const message = response.data['choices'][0]['message'];
        messages.push(message);

        if ('function_call' in message) {
            const function_name = message.function_call.name;
    
            let function_to_call = null;
            for (const func of functions) {
              if (func['name'] === function_name) {
                function_to_call = func['name'];
                break;
              }

            }
            
            console.log(function_to_call, 'call');
            const function_args = JSON.parse(message.function_call.arguments);
    
            console.log(function_args, 'args');
            let function_response = null;
            if (function_name === 'pdd_search') {
              function_response = await this.pdd_search(user_prompt);
              console.log(function_response, 'func res');
            } else if (function_name === 'answer_question') {
              function_response = await this.answer_question(function_args['user_input']);
              console.log(function_response, 'Function response');
            } else {
              console.log('error');
            }
            
            messages.push({
              role: 'function',
              name: function_name,
              content: function_response,
            });


          } 


            const second_response = await this.openai.createChatCompletion(
              {
                model: "gpt-3.5-turbo",
                messages:messages
              
              },
              
        
            )
            console.log('hello ')

            console.log(second_response.data['choices'][0]['message'], 'Second')

          
        



        

              
            

      } catch (error: any) {
        throw new HttpException('Error', error);
      }


  }
}


