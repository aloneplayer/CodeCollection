/* 
Javascript Terminal

Copyright (c) 2011 Fabrice Bellard

Redistribution or commercial use is prohibited without the author's
permission.
*/
"use strict";
//
if (!Function.prototype.bind)
{
    Function.prototype.bind = function (aa)
    {
        var ba = [].slice;
        var ca = ba.call(arguments, 1);
        var self = this;
        var da = function ()
        {
        };
        var ea = function ()
        {
            return self.apply(this instanceof da ? this : (aa || {}), ca
					.concat(ba.call(arguments)));
        };
        da.prototype = self.prototype;
        ea.prototype = new da();
        return ea;
    };
}

//Constructor of Term
//ha 函数把用户输入传递给VM
function Term(width, height, ha)
{
    this.w = width;
    this.h = height;
    this.x = 0;
    this.y = 0;
    this.cursorstate = 0;
    this.handler = ha;
    this.convert_lf_to_crlf = false;
    this.state = 0;
    this.output_queue = "";
    this.bg_colors = ["#000000", "#ff0000", "#00ff00", "#ffff00", "#0000ff",
			"#ff00ff", "#00ffff", "#ffffff"];
    this.fg_colors = ["#000000", "#ff0000", "#00ff00", "#ffff00", "#0000ff",
			"#ff00ff", "#00ffff", "#ffffff"];
    this.def_attr = (7 << 3) | 0;    // default的字符属性为111000 , 高3位为fg_Color, 低3位为bg_Color
    this.cur_attr = this.def_attr;
    this.is_mac = (navigator.userAgent.indexOf("Mac") >= 0) ? true : false;
}

//
Term.prototype.open = function()
{
    var y, ia, i, ja, c;
    this.lines = new Array();
    c = 32 | (this.def_attr << 16);   //defatul attribute = 111000 , 32=100000
    //逐行操作
    for (y = 0; y < this.h; y++)
    {
        ia = new Array();
        for (i = 0; i < this.w; i++)   //initrialize行中每个字符, 低16位为字符，17-19位为背景色，21-22为前景色
            ia[i] = c;
        this.lines[y] = ia;
    }
    document.writeln('<table border="0" cellspacing="0" cellpadding="0">');
    //向terminal table中添加row， td的id为 tliney
    for (y = 0; y < this.h; y++)
    {
        document.writeln('<tr><td class="term" id="tline' + y + '"></td></tr>');
    }
    document.writeln('</table>');
    
    //refresh all lines, from 0 to h-1
    this.refresh(0, this.h - 1);

    document.addEventListener("keydown", this.keyDownHandler.bind(this), true);
    document.addEventListener("keypress", this.keyPressHandler.bind(this), true);
    ja = this;
    //光标闪烁，每秒执行一次
    setInterval(function()
    {
        ja.cursor_timer_cb();
    }, 1000);
};

//refresh terminal, from line yStart to yEnd
//把terminal中的内容(字符,前景色,背景色)显示到html页面上
Term.prototype.refresh = function(yStart, yEnd)
{
    var domTD, y, currentLine, innerHtml, currentChar, w, i, cursorX, attribute, preAttribute, fgColor, bgColor;
    for (y = yStart; y <= yEnd; y++)
    {
        currentLine = this.lines[y];  //current line
        innerHtml = "";
        w = this.w;
        if (y == this.y && this.cursor_state)
        {
            cursorX = this.x;
        } 
        else
        {
            cursorX = -1;
        }
        preAttribute = this.def_attr;
        for (i = 0; i < w; i++)   //Porcess chars in current line
        {
            currentChar = currentLine[i];   //current char
            attribute = currentChar >> 16;
            currentChar &= 0xffff;
            if (i == cursorX)
            {
                attribute = -1;
            }
            if (attribute != preAttribute)
            {
                if (preAttribute != this.def_attr)    //end of the <span> for the special style char
                    innerHtml += '</span>';
                if (attribute != this.def_attr)
                {
                    if (attribute == -1)
                    {
                        innerHtml += '<span class="termReverse">';
                    } 
                    else
                    {
                        innerHtml += '<span style="';
                        fgColor = (attribute >> 3) & 7;    //attribute的高三位为前景色
                        bgColor = attribute & 7;           //attribute的低三位为背景色
                        if (fgColor != 7)
                        {
                            innerHtml += 'color:' + this.fg_colors[fgColor] + ';';
                        }
                        if (bgColor != 0)
                        {
                            innerHtml += 'background-color:' + this.bg_colors[bgColor] + ';';
                        }
                        innerHtml += '">';
                    }
                }
            }
            switch (currentChar)
            {
                case 32: // Space
                    innerHtml += "&nbsp;";
                    break;
                case 38: //&
                    innerHtml += "&amp;";
                    break;
                case 60: //<
                    innerHtml += "&lt;";
                    break;
                case 62: //>
                    innerHtml += "&gt;";
                    break;
                default:
                    if (currentChar < 32)
                    {
                        innerHtml += "&nbsp;";
                    } 
                    else
                    {
                        innerHtml += String.fromCharCode(currentChar);
                    }
                    break;
            }
            preAttribute = attribute;
        }  // Endof  process every char
        if (preAttribute != this.def_attr)
        {
            innerHtml += '</span>';
        }
        domTD = document.getElementById("tline" + y);
        domTD.innerHTML = innerHtml;
    } 
};

//光标闪烁
Term.prototype.cursor_timer_cb = function()
{
    this.cursor_state ^= 1;
    this.refresh(this.y, this.y);
};

//显示光标
Term.prototype.show_cursor = function()
{
    if (!this.cursor_state)
    {
        this.cursor_state = 1;
        this.refresh(this.y, this.y);
    }
};

Term.prototype.scroll = function()
{
    var y, ia, x, c;
    for (y = 0; y < this.h; y++)
        this.lines[y] = this.lines[y + 1];
    c = 32 | (this.def_attr << 16);
    ia = new Array();
    for (x = 0; x < this.w; x++)
        ia[x] = c;   // Build a empty line
    this.lines[this.h - 1] = ia;
};

//Write string
Term.prototype.write = function(str)
{
    var ya = 0;   //input mode
    var za = 1;   //command mode
    var Aa = 2;   //insert mode
    var i, chr, ka, la, l, n, j;

    ka = this.h;
    la = -1;
    ua(this.y);  
   
    for (i = 0; i < str.length; i++)
    {
        chr = str.charCodeAt(i);
        switch (this.state)
        {
            case ya:   //input mode
                switch (chr)
                {
                    case 10:   //LF  \n
                        if (this.convert_lf_to_crlf)
                        {
                            this.x = 0;
                        }
                        this.y++;
                        if (this.y >= this.h)
                        {
                            this.y--;
                            this.scroll();
                            ka = 0;
                            la = this.h - 1;
                        }
                        break;
                    case 13:   //CR   \r
                        this.x = 0;
                        break;
                    case 8:    //backsapce
                        if (this.x > 0)
                        {
                            this.x--;
                        }
                        break;
                    case 9:   //Tab
                        n = (this.x + 8) & ~7;
                        if (n <= this.w)
                        {
                            this.x = n;
                        }
                        break;
                    case 27:  //Esc
                        this.state = za;
                        break;
                    default:
                        if (chr >= 32)   //可见字符
                        {
                            if (this.x >= this.w)
                            {
                                this.x = 0;aaa
                                this.y++;
                                if (this.y >= this.h)
                                {
                                    this.y--;
                                    this.scroll();
                                    ka = 0;
                                    la = this.h - 1;
                                }
                            }
                            // 设置字符和字符的外观
                            this.lines[this.y][this.x] = (chr & 0xffff) | (this.cur_attr << 16);
                            this.x++;
                            ua(this.y);
                        }
                        break;
                }
                break;
            case za:   //vi command mode
                if (chr == 91)   //[
                {
                    this.esc_params = new Array();
                    this.cur_param = 0;
                    this.state = Aa;     //
                } 
                else
                {
                    this.state = ya;
                }
                break;
            case Aa:     //vi insert mode
                if (chr >= 48 && chr <= 57)  //0-9
                {
                    this.cur_param = this.cur_param * 10 + chr - 48;    //输入的数字10*n+m
                } 
                else
                {
                    this.esc_params[this.esc_params.length] = this.cur_param;
                    this.cur_param = 0;
                    if (chr == 59)   // ;
                        break;
                    this.state = ya;
                    switch (chr)      
                    {
                        case 65:       //A
                            n = this.esc_params[0];
                            if (n < 1)
                                n = 1;
                            this.y -= n;
                            if (this.y < 0)
                                this.y = 0;
                            break;
                        case 66:      //B
                            n = this.esc_params[0];
                            if (n < 1)
                                n = 1;
                            this.y += n;
                            if (this.y >= this.h)
                                this.y = this.h - 1;
                            break;
                        case 67:      //C
                            n = this.esc_params[0];
                            if (n < 1)
                                n = 1;
                            this.x += n;
                            if (this.x >= this.w - 1)
                                this.x = this.w - 1;
                            break;
                        case 68:    //D    delete n chars
                            n = this.esc_params[0];
                            if (n < 1)
                                n = 1;
                            this.x -= n;
                            if (this.x < 0)
                                this.x = 0;
                            break;
                        case 72:    //H
                            {
                                var Ba, Ca;
                                Ca = this.esc_params[0] - 1;
                                if (this.esc_params.length >= 2)
                                    Ba = this.esc_params[1] - 1;
                                else
                                    Ba = 0;
                                if (Ca < 0)
                                    Ca = 0;
                                else if (Ca >= this.h)
                                    Ca = this.h - 1;
                                if (Ba < 0)
                                    Ba = 0;
                                else if (Ba >= this.w)
                                    Ba = this.w - 1;
                                this.x = Ba;
                                this.y = Ca;
                            }
                            break;
                        case 74:      //J   初始化vi屏幕
                            fillEmptyChar(this, this.x, this.y);
                            for (j = this.y + 1; j < this.h; j++)
                                fillEmptyChar(this, 0, j);
                            break;
                        case 75:      //K
                            fillEmptyChar(this, this.x, this.y);
                            break;
                        case 109:     //m
                            wa(this, this.esc_params);
                            break;
                        case 110:      //n
                            this.queue_chars("\x1b[" + (this.y + 1) + ";" + (this.x + 1) + "R");
                            break;
                        default:
                            break;
                    }
                }
                break;
        }
    }  //end of for (i = 0; i < str.length; i++)
    
    ua(this.y);
    if (la >= ka)
        this.refresh(ka, la);
    //
    function ua(y)
    {
        ka = Math.min(ka, y);
        la = Math.max(la, y);
    }
    //用 "empty" char 填充第y行，x列之后的部分 
    function fillEmptyChar(terminal, x, y)
    {
        var l, i, c;
        l = terminal.lines[y];
        c = 32 | (terminal.def_attr << 16);  // 空字符,只有外观
        for (i = x; i < terminal.w; i++)
            l[i] = c;
        ua(y);
    }

    function wa(terminal, xa)
    {
        var j, n;
        if (xa.length == 0)
        {
            terminal.cur_attr = terminal.def_attr;
        } 
        else
        {
            for (j = 0; j < xa.length; j++)
            {
                n = xa[j];
                if (n >= 30 && n <= 37)
                {
                    terminal.cur_attr = (terminal.cur_attr & ~(7 << 3)) | ((n - 30) << 3);
                } 
                else if (n >= 40 && n <= 47)
                {
                    terminal.cur_attr = (terminal.cur_attr & ~7) | (n - 40);
                } 
                else if (n == 0)
                {
                    terminal.cur_attr = terminal.def_attr;
                }
            }
        }
    }
};

Term.prototype.writeln = function(message)
{
    this.write(message + '\r\n');
};

//处理按键输入，event.keyCode=按键的编码
Term.prototype.keyDownHandler = function(Da)
{
    var ta;
    ta = "";
    switch (Da.keyCode)
    {
        case 8:  //Backspace
            ta = ""; 
            break;
        case 9:  //Tab
            ta = "\t";
            break;
        case 13:  //Enter
            ta = "\r";
            break;
        case 27:  //Esc 
            ta = "\x1b";
            break;
        case 37:  //left, ANSI Escape sequences 
            ta = "\x1b[D";
            break;
        case 39:  //right
            ta = "\x1b[C";
            break;
        case 38:  //Up
            ta = "\x1b[A";
            break;
        case 40:  //Down
            ta = "\x1b[B";
            break;
        case 46:  //Delete
            ta = "\x1b[3~";
            break;
        case 45:  //Inster
            ta = "\x1b[2~";
            break;
        case 36:   //Home
            ta = "\x1bOH";
            break;
        case 35:   //End
            ta = "\x1bOF";
            break;
        case 33:   //Page Up
            ta = "\x1b[5~";
            break;
        case 34:   //Page Down
            ta = "\x1b[6~";
            break;
        default:
            if (Da.ctrlKey)
            {
                if (Da.keyCode >= 65 && Da.keyCode <= 90)  //control+A-Z
                {
                    // fromCharCode: Unicode to string
                    ta = String.fromCharCode(Da.keyCode - 64);
                } 
                else if (Da.keyCode == 32)   //space
                {
                    ta = String.fromCharCode(0);
                }
            } 
            else if ((!this.is_mac && Da.altKey) || (this.is_mac && Da.metaKey))   //Alt/CMD+ A-Z
            {
                if (Da.keyCode >= 65 && Da.keyCode <= 90)   //A-Z
                {
                    ta = "\x1b" + String.fromCharCode(Da.keyCode + 32);
                }
            }
            break;
    }
    if (ta)
    {
        if (Da.stopPropagation)
            Da.stopPropagation();
        if (Da.preventDefault)
            Da.preventDefault();
        this.show_cursor();
        this.handler(ta);    // Send key to VM
        return false;
    } 
    else
    {
        return true;
    }
};

//处理字符输入,event.charCode
Term.prototype.keyPressHandler = function(Da)
{
    var ta;
    if (Da.stopPropagation)
        Da.stopPropagation();
    if (Da.preventDefault)
        Da.preventDefault();
    ta = "";
    if (Da.charCode != 0)
    {
        if (!Da.ctrlKey
				&& ((!this.is_mac && !Da.altKey) || (this.is_mac && !Da.metaKey)))
        {
            ta = String.fromCharCode(Da.charCode);
        }
    }
    if (ta)
    {
        this.show_cursor();
        this.handler(ta); // Send key to VM
        return false;
    }
    else
    {
        return true;
    }
};

Term.prototype.queue_chars = function(ta)
{
    this.output_queue += ta;
    if (this.output_queue)
        setTimeout(this.outputHandler.bind(this), 0);
};

Term.prototype.outputHandler = function()
{
    if (this.output_queue)
    {
        this.handler(this.output_queue);
        this.output_queue = "";
    }
};