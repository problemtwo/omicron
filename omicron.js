// set x = 0;
// set f = func (x,y) -> {x; y;};
// call f(1,2)
// if x then y else z

class Tokenizer {
	constructor(text) {
		this.text = text;
		this.pos = 0;
		this.ops = ['<>','=','<=','->','>=','%=','-=','*=','>','(',',',
              '+=','+','/','-','*','!','<','/=',';',')','->','{','}'];
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
symtable.define = function(name,callback) {
 symtable[name] = callback;
}
symtable.define('println',function(arg) {
 console.log(arg);
});

class Entity {};

class NumericEntity extends Entity {
	constructor(token){
		super();
		this.token = token;
	}
	start(){
		return parseFloat(this.token.value);
	}
};

class StringEntity extends Entity {
	constructor(token){
		super();
		this.token = token;
	}
	start(){
		return this.token.value.substr(1,this.token.value.length-2);
	}
};

class IdentifierEntity extends Entity {
	constructor(token){
		super();
		this.token = token;
	}
	start(){
		return symtable[this.token.value];
	}
};

class AssignmentEntity extends Entity {
	constructor(lval,rval) {
		super();
		this.lval = lval;
		this.rval = rval;
	}
	start(){
		return symtable[this.lval.token.value] = this.rval.start();
	}
};

class FunctionEntity extends Entity {
 constructor(name,args,body){
  super();
  this.name = name;
  this.args = args;
  this.body = body;
  if(typeof this.name !== 'undefined'){
   symtable[this.name] = this.start();
  }
 }
 start(){
  const _this = this;
  return function(...args) {
   for(let i=0;i<args.length;i++){
    symtable[_this.args[i].token.value] = args[i];
   }
   let r = _this.body.start();
   for(let i=0;i<args.length;i++){
    symtable[_this.args[i].token.value] = undefined;
   }
   return r;
  };
 }
}

class FunctionCallEntity extends Entity {
	constructor(name,args){
		super();
		this.name = name;
		this.args = args;
	}
	start(){
		return symtable[this.name.token.value].apply(null,this.args.map(v => v.start()));
	}
};

class IfEntity extends Entity {
	constructor(cond,clause){
		super();
		this.cond = cond;
		this.clause = clause;
	}
	start(){
		if(this.cond.start()){this.clause.start();}
	}
};

class IfElseEntity extends IfEntity {
	constructor(cond,clause,_else){
		super(cond,clause);
		this._else = _else;
	}
	start(){
		if(this.cond.start()){
			this.clause.start();
		}else{
			this._else.start();
		}
	}
};

class ParentheticalEntity extends Entity {
	constructor(expr){
		super();
		this.expr = expr;
	}
	start(){
		return typeof this.expr === 'undefined' ? 0 : this.expr.start();
	}
};

class ClauseEntity extends Entity {
	constructor(stmts){
		super();
		this.stmts = stmts;
	}
	start(){
  if(this.stmts.length === 0){return undefined;}
		for(let i=0;i<this.stmts.length-1;i++){
			this.stmts[i].start();
		}
		return this.stmts[this.stmts.length-1].start();
	}
};

class OperatorExpression {
 constructor(expr){
  this.expr = expr;
 }
 start(){
  let val = this.expr[0].start();
  for(let i=1;i<this.expr.length;i+=2){
   const operator = this.expr[i].value;
   if     (operator === '+'){val += this.expr[i+1].start();}
   else if(operator === '-'){val -= this.expr[i+1].start();}
   else if(operator === '*'){val *= this.expr[i+1].start();}
   else if(operator === '/'){val /= this.expr[i+1].start();}
   else if(operator === '%'){val %= this.expr[i+1].start();}
  }
  if(parseInt(val) !== NaN){return parseInt(val);}
  return val;
 }
}

class ParsingException {
	constructor(message) {
		this.name = 'ParsingException';
		this.message = message;
	}
};

class Parser {
	constructor(tokens){
		this.tokens = tokens;
		this.pos = 0;
		this.operators = [
			'<>','<=','>=','==','<>','+=','-=','*=','/=','%=','+','-','*','/','%','<','>'
		];
	}
	get(){return this.tokens[this.pos];}
	consume(){return this.tokens[this.pos++];}
	expect(t){if(this.get().value === t){return this.consume();}
           else{throw new ParsingException('Expected ' + t + ' got ' + this.get().value + '.');}}
	parseSet(){
		this.expect('set'); // set
		const lval = this.parseEntity(); // variable name (ex. x)
		this.expect('='); // =
		const rval = this.parseExpr();
		return new AssignmentEntity(lval,rval);
	}
	parseCall(){
		this.expect('call'); // call
		const lval = this.parseEntity(); // variable name (ex. x)
		this.expect('(') // (
  let args;
  if(this.get().value === ')'){
   args = [] 
  }else{
   args = [this.parseExpr()];
   while(!this.EOF() && this.get().value !== ')'){
    this.expect(',');
    args.push(this.parseExpr());
   }
   if(this.EOF()){throw new ParsingException('Expected ) got EOF.');}
  }
		this.expect(')');
		return new FunctionCallEntity(lval,args);
	}
	parseIf(){
		this.expect('if');
		const cond = this.parseExpr();
		const clause = this.parseExpr();
		const _else = null;
		if(this.get().value === 'else'){
			this.consume();
			_else = this.parseExpr();
		}
		return _else === null ? new IfEntity(cond,clause) : new IfElseEntity(cond,clause,_else);
	}
	parseParens(){
		this.expect('(');
  let expr;
  if(this.get().value !== ')'){
   expr = this.parseExpr();
  }
		this.expect(')');
		return new ParentheticalEntity(expr);
	}
	parseClause(){
		this.expect('{');
		const stmts = [];
		while(this.get().value !== '}'){
			stmts.push(this.parseExpr());
		}
		return new ClauseEntity(stmts);
	}
 parseFunc(){
  this.expect('func');
  let name = undefined;
  if(this.get().type === 'identifier'){
   name = this.consume().value;
  }
  this.expect('(');
  let args;
  if(this.get().value === ')'){
   args = []
  }
  else{
   args = [this.parseExpr()];
   while(!this.EOF() && this.get().value !== ')'){
    this.expect(',');
    args.push(this.parseExpr());
   }
   this.expect(')');
  }
  this.expect('->');
  const body = this.parseClause();
  return new FunctionEntity(name,args,body);
 }
	EOF(){return this.pos >= this.tokens.length;}
	parseEntity(){
		if(this.EOF()){throw new ParsingException('Expected entity got EOF.');}
		switch(this.get().type){
			case 'number':
				return new NumericEntity(this.consume());
			case 'string':
				return new StringEntity(this.consume());
			case 'operator':
				switch(this.get().value){
					case '(':
						return this.parseParens();
					case '{':
						return this.parseClause();
					default:
						break;
				}
			case 'identifier':
				switch(this.get().value){
					case 'set':
						return this.parseSet();
					case 'call':
						return this.parseCall();
					case 'if':
						return this.parseIf();
     case 'func':
      return this.parseFunc();
					default:
						return new IdentifierEntity(this.consume());
				}
				break;
		}
		throw new ParsingException('Unknown entity: ' + this.tokens[this.pos].value + '.');
	}
	parseExpr(){
		const expr = [];
		expr.push(this.parseEntity());
		while(!this.EOF() && this.operators.includes(this.get().value)){
			expr.push(this.consume());
			expr.push(this.parseEntity());
		}
		return expr.length === 1 ? expr[0] : new OperatorExpression(expr);
	}
	start(){
		const lines = [];
		for(;!this.EOF();this.consume()){
			lines.push(this.parseExpr());
		}
		return lines;
	}
};

