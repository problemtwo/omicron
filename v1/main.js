// set x = 0;
// set f = (x,y) -> (x; y; );

class Tokenizer {
	constructor(text) {
		this.text = text;
		this.pos = 0;
		this.ops = ['<>','=','<=','>=','%=','-=','*=','>','(',',',
              '+=','+','/','-','*','!','<','/=',';',')','->'];
	}
	get(){return this.text[this.pos];}
	peek(){return this.pos+1 < this.text.length ? this.text[this.pos+1] : undefined;}
	consume(){return this.text[this.pos++];}
	devour(t){let value = this.text.slice(this.pos,this.pos+t.length);this.pos += t.length;return value;}
	match(t){return t === this.text.slice(this.pos,this.pos+t.length);}
	start(){
		const tokens = [];
		search: while(this.pos<this.text.length){
			if(this.get() === undefined){break;}
			else if(' \n'.includes(this.get())){this.consume();continue;}
			else if('0123456789.'.includes(this.get())){
				let num = '';
				while('0123456789.'.includes(this.get())){
					num += this.consume();
				}
				tokens.push({'type':'number','value':num});
				continue;
			}
			else if('\'\"'.includes(this.get())){
				let str = this.consume();
				do{
					str += this.consume();
				}while(this.get() !== str.charAt(0));
				str += this.consume();
				tokens.push({'type':'string','value':str});
				continue;
			}
			else if(this.get().toUpperCase() !== this.get().toLowerCase()){
				let wrd = this.consume();
				if(this.get().toUpperCase() !== this.get().toLowerCase()){
					do{
						wrd += this.consume();
					}while(this.get().toUpperCase() !== this.get().toLowerCase());
				}
				tokens.push({'type':'identifier','value':wrd});
				continue;
			}
			else{
				for(let op of this.ops){
					if(this.match(op)){tokens.push({'type':'operator','value':this.devour(op)});;continue search;}
				}
			}
			this.consume();
		}
		return tokens;
	}
};

let symtable = {};

class Expression {
	constructor(tokens){this.tokens = tokens;}
};

class NumberExpression extends Expression {
	constructor(tokens,val){
		super(tokens);
		this.val = val;
	}
	start(){return this.val;}
};

class StringExpression extends Expression {
	constructor(tokens,val){
		super(tokens);
		this.val = val;
	}
	start(){return this.val;}
};

class IdentifierExpression extends Expression {
	constructor(tokens,val){
		super(tokens);
		this.val = val;
	}
	start(){return symtable[this.val];}
}

class OperatorExpression extends Expression {
	constructor(tokens,lval,op,rval){
		super(tokens);
		this.lval = lval;
		this.op = op;
		this.rval = rval;
	}
	start(){
		let lval = this.lval.start(),
      rval = this.rval.start();
		switch(this.op){
			case '+':
				return lval + rval;
			case '-':
				return lval - rval;
			case '*':
				return lval * rval;
			case '/':
				return lval / rval;
			case '%':
				return lval % rval;
			case '>':
				return lval > rval;
			case '<':
				return lval < rval;
			case '>=':
				return lval >= rval;
			case '<=':
				return lval <= rval;
			default:
				return undefined;
		}
	}
};

class Statement {
	constructor(tokens){this.tokens = tokens;}
};

class Assignment extends Statement {
	constructor(tokens,lval,rval){
		super(tokens);
		this.lval = lval;
		this.rval = rval;
	}
	start(){
		symtable[this.lval.val] = this.rval.start();
	}
};

class Parser {
	constructor(tokens){
		this.tokens = tokens;
		this.pos = 0;
	}
	get(){return this.tokens[this.pos];}
	peek(i){return this.pos+i < this.tokens.length ? this.tokens[this.pos+i] : undefined;}
	seek(t){
		for(let i=this.pos;i<this.tokens.length;i++){
			if(this.tokens[i].value === t){return i-this.pos;}
		}
		return -1;
	}
	consume(){return this.tokens[this.pos++];}
	devour(t){const r = this.tokens.slice(this.pos,t);this.pos += t;return r;}	
	match(t){
		for(let i=0;i<t.length;i++){
			if(t[i].hasOwnProperty('type') && t[i].type !== this.tokens[this.pos+i].type){
				return false;
			}
			if(t[i].hasOwnProperty('value') && t[i].value !== this.tokens[this.pos+i].value){
				return false;
			}
		}
		return true;
	}
	// Made with help from http://scriptasylum.com/tutorials/infix_postfix/algorithms/infix-postfix/index.htm
	parseExpression(tokens){
		let stack = [],last_prec = -1;
		let postfix = [];
		const PREC = {'+':0,'-':0,'*':1,'/':1,'%':1,'>':2,'<':2,'<=':2,'>=':2,'=':2,'!':2};
		for(let i=0;i<tokens.length;i++){
			if(['number','string','identifier'].includes(tokens[i].type)){
				postfix.push(tokens[i]);
			}else if(tokens[i].type === 'operator'){
				if(tokens[i].value === '('){
					let expr = [];
					for(let j=1;typeof tokens[i+j] !== 'undefined' && tokens[i+j].value !== ')';j++){
						expr.push(tokens[i+j]);
					}
					stack.push({'type':'expr','value':this.parseExpression(expr)});
				}
				else if(PREC[tokens[i].value] > last_prec){
					last_prec = PREC[tokens[i].value];
					stack.push(tokens[i]);
				}else{
					postfix.push(tokens[i]);
				}
			}
		}
		while(stack.length > 0){
			postfix.push(stack.pop());
		}
		stack = [];
		for(let i=0;i<postfix.length;i++){
			switch(postfix[i].type){
				case 'number':
					stack.push(new NumberExpression([postfix[i]],parseFloat(postfix[i].value)));
					break;
				case 'string':
					stack.push(new StringExpression([postfix[i]],postfix[i].value.substr(1,postfix[i].length-2)));
					break;
				case 'identifier':
					stack.push(new IdentifierExpression([postfix[i]],postfix[i].value));
					break;
				case 'operator':
					let op2 = stack.pop();
					let op1 = stack.pop();
					stack.push(new OperatorExpression([op1,postfix[i],op2],op1,postfix[i].value,op2));
					break;
				default:
					break;
				case 'expr':
					stack.push(postfix[i].value);
					break;
			}
		}
		return stack[0];
	}
	start(){
		const lines = [];
		while(this.pos < this.tokens.length){
			if(this.match({'value':'set'},{'type':'identifier'},{'value':'='})){
				const tokens = this.devour(this.seek(';'));
				this.consume();
				lines.push(new Assignment(tokens,new IdentifierExpression(tokens[1],tokens[1].value),this.parseExpression(tokens.slice(3))));
			}
			else if(this.match({'value':'call'},{'type':'identifier'},{'value':'('})){
				const tokens = this.devour(this.seek(';'));
				this.consume();
				const stmt = tokens[1].value + '(';
				let i=2;
				for(;tokens[i+1].value!==')';i++){
					stmt += tokens[i].value + ',';
				}
				stmt += tokens[i].value + ')';
				eval(stmt);
			}
		}
		return lines;
	}
};

function println(x) {console.log(x);}

t = new Tokenizer('call println(\'It works!\');');
new Parser(t.start()).start().forEach(v => v.start());
console.log(symtable);
