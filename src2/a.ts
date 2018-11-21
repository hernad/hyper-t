import { func_b1 } from  './b/b1'
// import { func_b1 } from '@b/b1'
import * as nls from './base/nls';

function f1( a: string ) {
    console.log(a);
}


export function fa() {
   let msg = "hello"
   msg = nls.localize('repeated', "{0} radi lokalizacija :)", msg);

   f1(msg);
   func_b1();
}


fa();