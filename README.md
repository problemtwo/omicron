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
To assign a variable, simply use the 'set' keyword (semi-colons are required).
```
 set x = 0;
```
You can assign a variable to a string, a number, or even a function.
```
 set y = func(a,b){return a*b;};
```
Or you can assign a function like this
```
 func y (a , b){return a * b ;} ;
```
Wait, but what if I want to call that function?
```
 call y(1,2)
```
Can my function return a value?
```
 'Comments are written like this'
 set x = call y(2,3) '6'
```
(The return value of your function is the last value in the function. For example...)
```
 func returnExample(){'do some stuff here'; 6;}; 'This function returns 6'
```
