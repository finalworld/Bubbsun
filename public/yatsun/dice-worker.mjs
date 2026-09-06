import {simulateThrow} from './dice-physics.mjs?v=physics32';
self.onmessage=({data})=>{
  try {self.postMessage({id:data.id,trace:simulateThrow(data.options)});}
  catch(error) {self.postMessage({id:data.id,error:error.message});}
};
