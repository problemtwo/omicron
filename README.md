# Omicron
A programming language for the web.
Omicron was built to make web game development super easy.

### To install:
```bash
 git clone https://github.com/the-inhuman-account/omicron.git
 cd omicron/v2
 cp -r omicron.js your-game-directory
```
```html
 <script src='omicron.js'></script>
```

### Syntax
```javascript
 'Comments are written like this'
 'To assign a variable, simply use the 'set' keyword (semi-colons are required).'
 set x = 0;
 'You can assign a variable to a string, a number, or even a function.'
 set num = 1
 set string = 'Just another string/comment/print function argument...'
 set y = func(a,b){return a\*b;};
 'You can also declare a function like this.'
 func y(a,b){return a\*b;};
 'Calling a function is pretty self-explanatory.'
 call y(1,2);
 'Just because there is no return keyword, doesn't meant that your function cannot return a value.'
 'The last value of your function will be the value that is returned.'
 set returnExample = func () {'just another bit of code/string/comment/print function argument...';6}
 call returnExample() ' <--- 6'
```
