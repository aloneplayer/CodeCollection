/* 
PC Emulator

Copyright (c) 2011 Fabrice Bellard

Redistribution or commercial use is prohibited without the author's
permission.
*/
"use strict";
var terminal;
var ba = [1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0,
		1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1,
		0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0,
		1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0,
		1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0,
		1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1,
		0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1,
		0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1,
		0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0,
		1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1,
		0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1];
var ca = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 0, 1, 2,
		3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
var da = [0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4,
		5, 6, 7, 8, 0, 1, 2, 3, 4];

function ea()
{
    var i, fa;
    this.regs = new Array();
    for (i = 0; i < 8; i++)
        this.regs[i] = 0;
    this.eip = 0;
    this.cc_op = 0;
    this.cc_dst = 0;
    this.cc_src = 0;
    this.cc_op2 = 0;
    this.cc_dst2 = 0;
    this.df = 1;
    this.eflags = 0x2;
    this.cycle_count = 0;
    this.hard_irq = 0;
    this.cpl = 0;
    this.cr0 = (1 << 0);
    this.cr2 = 0;
    this.cr3 = 0;
    this.cr4 = 0;
    this.idt = {
        base: 0,
        limit: 0
    };
    this.gdt = {
        base: 0,
        limit: 0
    };
    this.segs = new Array();
    for (i = 0; i < 6; i++)
    {
        this.segs[i] = {
            selector: 0,
            base: 0,
            limit: 0,
            flags: 0
        };
    }
    this.tr = {
        selector: 0,
        base: 0,
        limit: 0,
        flags: 0
    };
    this.ldt = {
        selector: 0,
        base: 0,
        limit: 0,
        flags: 0
    };
    this.halted = 0;
    this.phys_mem = null;
    fa = 0x100000;
    this.tlb_read_kernel = new Int32Array(fa);
    this.tlb_write_kernel = new Int32Array(fa);
    this.tlb_read_user = new Int32Array(fa);
    this.tlb_write_user = new Int32Array(fa);
    for (i = 0; i < fa; i++)
    {
        this.tlb_read_kernel[i] = -1;
        this.tlb_write_kernel[i] = -1;
        this.tlb_read_user[i] = -1;
        this.tlb_write_user[i] = -1;
    }
    this.tlb_pages = new Int32Array(2048);
    this.tlb_pages_count = 0;
}
ea.prototype.phys_mem_resize = function(ga)
{
    this.mem_size = ga;
    this.phys_mem = new ArrayBuffer(ga);
    this.phys_mem8 = new Uint8Array(this.phys_mem, 0, ga);
    this.phys_mem16 = new Uint16Array(this.phys_mem, 0, ga / 2);
    this.phys_mem32 = new Int32Array(this.phys_mem, 0, ga / 4);
};
ea.prototype.ld8_phys = function(ha)
{
    return this.phys_mem8[ha];
};
ea.prototype.st8_phys = function(ha, ia)
{
    this.phys_mem8[ha] = ia;
};
ea.prototype.ld32_phys = function(ha)
{
    return this.phys_mem32[ha >> 2];
};
ea.prototype.st32_phys = function(ha, ia)
{
    this.phys_mem32[ha >> 2] = ia;
};
ea.prototype.tlb_set_page = function(ha, ja, ka, la)
{
    var i, ia, j;
    ja &= -4096;
    ha &= -4096;
    ia = ha ^ ja;
    i = ha >>> 12;
    if (this.tlb_read_kernel[i] == -1)
    {
        if (this.tlb_pages_count >= 2048)
        {
            this.tlb_flush_all1((i - 1) & 0xfffff);
        }
        this.tlb_pages[this.tlb_pages_count++] = i;
    }
    this.tlb_read_kernel[i] = ia;
    if (ka)
    {
        this.tlb_write_kernel[i] = ia;
    } else
    {
        this.tlb_write_kernel[i] = -1;
    }
    if (la)
    {
        this.tlb_read_user[i] = ia;
        if (ka)
        {
            this.tlb_write_user[i] = ia;
        } else
        {
            this.tlb_write_user[i] = -1;
        }
    } else
    {
        this.tlb_read_user[i] = -1;
        this.tlb_write_user[i] = -1;
    }
};
ea.prototype.tlb_flush_page = function(ha)
{
    var i;
    i = ha >>> 12;
    this.tlb_read_kernel[i] = -1;
    this.tlb_write_kernel[i] = -1;
    this.tlb_read_user[i] = -1;
    this.tlb_write_user[i] = -1;
};
ea.prototype.tlb_flush_all = function()
{
    var i, j, n, ma;
    ma = this.tlb_pages;
    n = this.tlb_pages_count;
    for (j = 0; j < n; j++)
    {
        i = ma[j];
        this.tlb_read_kernel[i] = -1;
        this.tlb_write_kernel[i] = -1;
        this.tlb_read_user[i] = -1;
        this.tlb_write_user[i] = -1;
    }
    this.tlb_pages_count = 0;
};
ea.prototype.tlb_flush_all1 = function(na)
{
    var i, j, n, ma, oa;
    ma = this.tlb_pages;
    n = this.tlb_pages_count;
    oa = 0;
    for (j = 0; j < n; j++)
    {
        i = ma[j];
        if (i == na)
        {
            ma[oa++] = i;
        } else
        {
            this.tlb_read_kernel[i] = -1;
            this.tlb_write_kernel[i] = -1;
            this.tlb_read_user[i] = -1;
            this.tlb_write_user[i] = -1;
        }
    }
    this.tlb_pages_count = oa;
};
ea.prototype.st8_N = function(ha, pa)
{
    var i;
    for (i = 0; i < pa.length; i++)
    {
        this.st8_phys(ha + i, pa[i]);
    }
};
//������ת����nλ16���Ƹ�ʽ��
function converHex(value, n)
{
    var i, s;
    var h = "0123456789ABCDEF";
    s = "";
    for (i = n - 1; i >= 0; i--)
    {
        s = s + h[(value >>> (i * 4)) & 15];
    }
    return s;
}
//�õ�8λ16������
function ra(n)
{
    return converHex(n, 8);
}
//�õ�2λ16������
function sa(n)
{
    return converHex(n, 2);
}
//�õ�4λ16������
function ta(n)
{
    return converHex(n, 4);
}
//��ʾ�Ĵ�����ֵ
ea.prototype.dump = function()
{
    var i, ua, va;
    var wa = [" ES", " CS", " SS", " DS", " FS", " GS", "LDT", " TR"];
    console.log("TSC=" + ra(this.cycle_count) + " EIP=" + ra(this.eip)
			+ "\nEAX=" + ra(this.regs[0]) + " ECX=" + ra(this.regs[1])
			+ " EDX=" + ra(this.regs[2]) + " EBX=" + ra(this.regs[3])
            + " ESP=" + ra(this.regs[4]) + " EBP=" + ra(this.regs[5]));

    console.log("ESI=" + ra(this.regs[6]) + " EDI=" + ra(this.regs[7]));

    console.log("EFL=" + ra(this.eflags) + " OP=" + sa(this.cc_op) + " SRC="
			+ ra(this.cc_src) + " DST=" + ra(this.cc_dst) + " OP2="
			+ sa(this.cc_op2) + " DST2=" + ra(this.cc_dst2));

    console.log("CPL=" + this.cpl + " CR0=" + ra(this.cr0) + " CR2="
			+ ra(this.cr2) + " CR3=" + ra(this.cr3) + " CR4=" + ra(this.cr4));
    va = "";
    for (i = 0; i < 8; i++)
    {
        if (i == 6)
            ua = this.ldt;
        else if (i == 7)
            ua = this.tr;
        else
            ua = this.segs[i];
        va += wa[i] + "=" + ta(ua.selector) + " " + ra(ua.base) + " "
				+ ra(ua.limit) + " " + ta((ua.flags >> 8) & 0xf0ff);
        if (i & 1)
        {
            console.log(va);
            va = "";
        } else
        {
            va += " ";
        }
    }
    ua = this.gdt;
    va = "GDT=     " + ra(ua.base) + " " + ra(ua.limit) + "      ";
    ua = this.idt;
    va += "IDT=     " + ra(ua.base) + " " + ra(ua.limit);
    console.log(va);
};

ea.prototype.exec = function(xa)
{
    var ya, ha, za;
    var Aa, Ba, Ca, Da, Ea;
    var Fa, Ga, Ha, b, Ia, ia, Ja, Ka, La, Ma, Na, Oa;
    var Pa, Qa;
    var Ra, Sa, Ta, Ua;
    var Va, Wa, Xa, Ya, Za, ab;
    function bb()
    {
        var cb;
        db(ha, 0, ya.cpl == 3);
        cb = Za[ha >>> 12] ^ ha;
        return Ra[cb];
    }
    function eb()
    {
        var Ua;
        return (((Ua = Za[ha >>> 12]) == -1) ? bb() : Ra[ha ^ Ua]);
    }
    function fb()
    {
        var ia;
        ia = eb();
        ha++;
        ia |= eb() << 8;
        ha--;
        return ia;
    }
    function gb()
    {
        var Ua;
        return (((Ua = Za[ha >>> 12]) | ha) & 1 ? fb() : Sa[(ha ^ Ua) >> 1]);
    }
    function hb()
    {
        var ia;
        ia = eb();
        ha++;
        ia |= eb() << 8;
        ha++;
        ia |= eb() << 16;
        ha++;
        ia |= eb() << 24;
        ha -= 3;
        return ia;
    }
    function ib()
    {
        var Ua;
        return (((Ua = Za[ha >>> 12]) | ha) & 3 ? hb() : Ta[(ha ^ Ua) >> 2]);
    }
    function jb()
    {
        var cb;
        db(ha, 1, ya.cpl == 3);
        cb = ab[ha >>> 12] ^ ha;
        return Ra[cb];
    }
    function kb()
    {
        var cb;
        return ((cb = ab[ha >>> 12]) == -1) ? jb() : Ra[ha ^ cb];
    }
    function lb()
    {
        var ia;
        ia = kb();
        ha++;
        ia |= kb() << 8;
        ha--;
        return ia;
    }
    function mb()
    {
        var cb;
        return ((cb = ab[ha >>> 12]) | ha) & 1 ? lb() : Sa[(ha ^ cb) >> 1];
    }
    function nb()
    {
        var ia;
        ia = kb();
        ha++;
        ia |= kb() << 8;
        ha++;
        ia |= kb() << 16;
        ha++;
        ia |= kb() << 24;
        ha -= 3;
        return ia;
    }
    function ob()
    {
        var cb;
        return ((cb = ab[ha >>> 12]) | ha) & 3 ? nb() : Ta[(ha ^ cb) >> 2];
    }
    function pb(ia)
    {
        var cb;
        db(ha, 1, ya.cpl == 3);
        cb = ab[ha >>> 12] ^ ha;
        Ra[cb] = ia;
    }
    function qb(ia)
    {
        var Ua;
        {
            Ua = ab[ha >>> 12];
            if (Ua == -1)
            {
                pb(ia);
            } else
            {
                Ra[ha ^ Ua] = ia;
            }
        }
        ;
    }
    function rb(ia)
    {
        qb(ia);
        ha++;
        qb(ia >> 8);
        ha--;
    }
    function sb(ia)
    {
        var Ua;
        {
            Ua = ab[ha >>> 12];
            if ((Ua | ha) & 1)
            {
                rb(ia);
            } else
            {
                Sa[(ha ^ Ua) >> 1] = ia;
            }
        }
        ;
    }
    function tb(ia)
    {
        qb(ia);
        ha++;
        qb(ia >> 8);
        ha++;
        qb(ia >> 16);
        ha++;
        qb(ia >> 24);
        ha -= 3;
    }
    function ub(ia)
    {
        var Ua;
        {
            Ua = ab[ha >>> 12];
            if ((Ua | ha) & 3)
            {
                tb(ia);
            } else
            {
                Ta[(ha ^ Ua) >> 2] = ia;
            }
        }
        ;
    }
    function vb()
    {
        var cb;
        db(ha, 0, 0);
        cb = Va[ha >>> 12] ^ ha;
        return Ra[cb];
    }
    function wb()
    {
        var cb;
        return ((cb = Va[ha >>> 12]) == -1) ? vb() : Ra[ha ^ cb];
    }
    function xb()
    {
        var ia;
        ia = wb();
        ha++;
        ia |= wb() << 8;
        ha--;
        return ia;
    }
    function yb()
    {
        var cb;
        return ((cb = Va[ha >>> 12]) | ha) & 1 ? xb() : Sa[(ha ^ cb) >> 1];
    }
    function zb()
    {
        var ia;
        ia = wb();
        ha++;
        ia |= wb() << 8;
        ha++;
        ia |= wb() << 16;
        ha++;
        ia |= wb() << 24;
        ha -= 3;
        return ia;
    }
    function Ab()
    {
        var cb;
        return ((cb = Va[ha >>> 12]) | ha) & 3 ? zb() : Ta[(ha ^ cb) >> 2];
    }
    function Bb(ia)
    {
        var cb;
        db(ha, 1, 0);
        cb = Wa[ha >>> 12] ^ ha;
        Ra[cb] = ia;
    }
    function Cb(ia)
    {
        var cb;
        cb = Wa[ha >>> 12];
        if (cb == -1)
        {
            Bb(ia);
        } else
        {
            Ra[ha ^ cb] = ia;
        }
    }
    function Db(ia)
    {
        Cb(ia);
        ha++;
        Cb(ia >> 8);
        ha--;
    }
    function Eb(ia)
    {
        var cb;
        cb = Wa[ha >>> 12];
        if ((cb | ha) & 1)
        {
            Db(ia);
        } else
        {
            Sa[(ha ^ cb) >> 1] = ia;
        }
    }
    function Fb(ia)
    {
        Cb(ia);
        ha++;
        Cb(ia >> 8);
        ha++;
        Cb(ia >> 16);
        ha++;
        Cb(ia >> 24);
        ha -= 3;
    }
    function Gb(ia)
    {
        var cb;
        cb = Wa[ha >>> 12];
        if ((cb | ha) & 3)
        {
            Fb(ia);
        } else
        {
            Ta[(ha ^ cb) >> 2] = ia;
        }
    }
    var Hb, Ib;
    function Jb(ha)
    {
        var cb;
        db(ha, 0, ya.cpl == 3);
        cb = Za[ha >>> 12] ^ ha;
        return Ra[cb];
    }
    function Kb()
    {
        var ia, Ja;
        ia = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb ^ Ua];
        Hb++;
        ;
        Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb ^ Ua];
        Hb++;
        ;
        return ia | (Ja << 8);
    }
    function Lb()
    {
        var ia, Ja, cb;
        cb = Za[Hb >>> 12];
        if (((Hb | cb) & 0xfff) <= 4092)
        {
            cb ^= Hb;
            ia = Ra[cb] | (Ra[cb + 1] << 8) | (Ra[cb + 2] << 16)
					| (Ra[cb + 3] << 24);
            Hb += 4;
        } else
        {
            ia = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb ^ Ua];
            Hb++;
            ;
            Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb ^ Ua];
            Hb++;
            ;
            ia |= Ja << 8;
            Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb ^ Ua];
            Hb++;
            ;
            ia |= Ja << 16;
            Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb ^ Ua];
            Hb++;
            ;
            ia |= Ja << 24;
        }
        return ia;
    }
    function Mb(Ga, Nb)
    {
        var base, ha, Ob, Pb;
        switch ((Ga & 7) | ((Ga >> 3) & 0x18))
        {
            case 0x04:
                Ob = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb ^ Ua];
                Hb++;
                ;
                base = Ob & 7;
                if (base == 5)
                {
                    ha = Lb();
                } else
                {
                    ha = za[base];
                    if (Nb && base == 4)
                        ha = (ha + Nb) & -1;
                }
                Pb = (Ob >> 3) & 7;
                if (Pb != 4)
                {
                    ha = (ha + (za[Pb] << (Ob >> 6))) & -1;
                }
                break;
            case 0x0c:
                Ob = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb ^ Ua];
                Hb++;
                ;
                ha = ((((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb ^ Ua]) << 24) >> 24;
                Hb++;
                ;
                base = Ob & 7;
                ha = (ha + za[base]) & -1;
                if (Nb && base == 4)
                    ha = (ha + Nb) & -1;
                Pb = (Ob >> 3) & 7;
                if (Pb != 4)
                {
                    ha = (ha + (za[Pb] << (Ob >> 6))) & -1;
                }
                break;
            case 0x14:
                Ob = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb ^ Ua];
                Hb++;
                ;
                ha = Lb();
                base = Ob & 7;
                ha = (ha + za[base]) & -1;
                if (Nb && base == 4)
                    ha = (ha + Nb) & -1;
                Pb = (Ob >> 3) & 7;
                if (Pb != 4)
                {
                    ha = (ha + (za[Pb] << (Ob >> 6))) & -1;
                }
                break;
            case 0x05:
                ha = Lb();
                break;
            case 0x00:
            case 0x01:
            case 0x02:
            case 0x03:
            case 0x06:
            case 0x07:
                base = Ga & 7;
                ha = za[base];
                break;
            case 0x08:
            case 0x09:
            case 0x0a:
            case 0x0b:
            case 0x0d:
            case 0x0e:
            case 0x0f:
                ha = ((((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb ^ Ua]) << 24) >> 24;
                Hb++;
                ;
                base = Ga & 7;
                ha = (ha + za[base]) & -1;
                break;
            case 0x10:
            case 0x11:
            case 0x12:
            case 0x13:
            case 0x15:
            case 0x16:
            case 0x17:
                ha = Lb();
                base = Ga & 7;
                ha = (ha + za[base]) & -1;
                break;
            default:
                throw "get_modrm";
        }
        if (Fa & 0x000f)
        {
            ha = (ha + ya.segs[(Fa & 0x000f) - 1].base) & -1;
        }
        return ha;
    }
    function Qb()
    {
        var ha;
        ha = Lb();
        if (Fa & 0x000f)
        {
            ha = (ha + ya.segs[(Fa & 0x000f) - 1].base) & -1;
        }
        return ha;
    }
    function Rb(Ia, ia)
    {
        if (Ia & 4)
            za[Ia & 3] = (za[Ia & 3] & -65281) | ((ia & 0xff) << 8);
        else
            za[Ia & 3] = (za[Ia & 3] & -256) | (ia & 0xff);
    }
    function Sb(Ia, ia)
    {
        za[Ia] = (za[Ia] & -65536) | (ia & 0xffff);
    }
    function Tb(La, Ub, Vb)
    {
        var Wb;
        switch (La)
        {
            case 0:
                Aa = Vb;
                Ub = (Ub + Vb) & -1;
                Ba = Ub;
                Ca = 0;
                break;
            case 1:
                Ub = Ub | Vb;
                Ba = Ub;
                Ca = 12;
                break;
            case 2:
                Wb = Xb(2);
                Aa = Vb;
                Ub = (Ub + Vb + Wb) & -1;
                Ba = Ub;
                Ca = Wb ? 3 : 0;
                break;
            case 3:
                Wb = Xb(2);
                Aa = Vb;
                Ub = (Ub - Vb - Wb) & -1;
                Ba = Ub;
                Ca = Wb ? 9 : 6;
                break;
            case 4:
                Ub = Ub & Vb;
                Ba = Ub;
                Ca = 12;
                break;
            case 5:
                Aa = Vb;
                Ub = (Ub - Vb) & -1;
                Ba = Ub;
                Ca = 6;
                break;
            case 6:
                Ub = Ub ^ Vb;
                Ba = Ub;
                Ca = 12;
                break;
            case 7:
                Aa = Vb;
                Ba = (Ub - Vb) & -1;
                Ca = 6;
                break;
            default:
                throw "arith" + 8 + ": invalid op";
        }
        return Ub;
    }
    function Yb(ia)
    {
        if (Ca < 25)
        {
            Da = Ca;
        }
        Ea = (ia + 1) & -1;
        Ca = 25;
        return Ea;
    }
    function Zb(ia)
    {
        if (Ca < 25)
        {
            Da = Ca;
        }
        Ea = (ia - 1) & -1;
        Ca = 28;
        return Ea;
    }
    function ac(La, Ub, Vb)
    {
        var Wb;
        switch (La)
        {
            case 0:
                Aa = Vb;
                Ub = (Ub + Vb) & -1;
                Ba = Ub;
                Ca = 1;
                break;
            case 1:
                Ub = Ub | Vb;
                Ba = Ub;
                Ca = 13;
                break;
            case 2:
                Wb = Xb(2);
                Aa = Vb;
                Ub = (Ub + Vb + Wb) & -1;
                Ba = Ub;
                Ca = Wb ? 4 : 1;
                break;
            case 3:
                Wb = Xb(2);
                Aa = Vb;
                Ub = (Ub - Vb - Wb) & -1;
                Ba = Ub;
                Ca = Wb ? 10 : 7;
                break;
            case 4:
                Ub = Ub & Vb;
                Ba = Ub;
                Ca = 13;
                break;
            case 5:
                Aa = Vb;
                Ub = (Ub - Vb) & -1;
                Ba = Ub;
                Ca = 7;
                break;
            case 6:
                Ub = Ub ^ Vb;
                Ba = Ub;
                Ca = 13;
                break;
            case 7:
                Aa = Vb;
                Ba = (Ub - Vb) & -1;
                Ca = 7;
                break;
            default:
                throw "arith" + 16 + ": invalid op";
        }
        return Ub;
    }
    function bc(ia)
    {
        if (Ca < 25)
        {
            Da = Ca;
        }
        Ea = (ia + 1) & -1;
        Ca = 26;
        return Ea;
    }
    function cc(ia)
    {
        if (Ca < 25)
        {
            Da = Ca;
        }
        Ea = (ia - 1) & -1;
        Ca = 29;
        return Ea;
    }
    function dc(La, Ub, Vb)
    {
        var Wb;
        switch (La)
        {
            case 0:
                Aa = Vb;
                Ub = (Ub + Vb) & -1;
                Ba = Ub;
                Ca = 2;
                break;
            case 1:
                Ub = Ub | Vb;
                Ba = Ub;
                Ca = 14;
                break;
            case 2:
                Wb = Xb(2);
                Aa = Vb;
                Ub = (Ub + Vb + Wb) & -1;
                Ba = Ub;
                Ca = Wb ? 5 : 2;
                break;
            case 3:
                Wb = Xb(2);
                Aa = Vb;
                Ub = (Ub - Vb - Wb) & -1;
                Ba = Ub;
                Ca = Wb ? 11 : 8;
                break;
            case 4:
                Ub = Ub & Vb;
                Ba = Ub;
                Ca = 14;
                break;
            case 5:
                Aa = Vb;
                Ub = (Ub - Vb) & -1;
                Ba = Ub;
                Ca = 8;
                break;
            case 6:
                Ub = Ub ^ Vb;
                Ba = Ub;
                Ca = 14;
                break;
            case 7:
                Aa = Vb;
                Ba = (Ub - Vb) & -1;
                Ca = 8;
                break;
            default:
                throw "arith" + 32 + ": invalid op";
        }
        return Ub;
    }
    function ec(ia)
    {
        if (Ca < 25)
        {
            Da = Ca;
        }
        Ea = (ia + 1) & -1;
        Ca = 27;
        return Ea;
    }
    function fc(ia)
    {
        if (Ca < 25)
        {
            Da = Ca;
        }
        Ea = (ia - 1) & -1;
        Ca = 30;
        return Ea;
    }
    function gc(La, Ub, Vb)
    {
        var hc, Wb;
        switch (La)
        {
            case 0:
                if (Vb & 0x1f)
                {
                    Vb &= 0x7;
                    Ub &= 0xff;
                    hc = Ub;
                    Ub = (Ub << Vb) | (Ub >>> (8 - Vb));
                    Aa = ic() & ~(0x0800 | 0x0001);
                    Aa |= (Ub & 0x0001) | (((hc ^ Ub) << 4) & 0x0800);
                    Ca = 24;
                }
                break;
            case 1:
                if (Vb & 0x1f)
                {
                    Vb &= 0x7;
                    Ub &= 0xff;
                    hc = Ub;
                    Ub = (Ub >>> Vb) | (Ub << (8 - Vb));
                    Aa = ic() & ~(0x0800 | 0x0001);
                    Aa |= ((Ub >> 7) & 0x0001) | (((hc ^ Ub) << 4) & 0x0800);
                    Ca = 24;
                }
                break;
            case 2:
                Vb = da[Vb & 0x1f];
                if (Vb)
                {
                    Ub &= 0xff;
                    hc = Ub;
                    Wb = Xb(2);
                    Ub = (Ub << Vb) | (Wb << (Vb - 1));
                    if (Vb > 1)
                        Ub |= hc >>> (9 - Vb);
                    Aa = ic() & ~(0x0800 | 0x0001);
                    Aa |= (((hc ^ Ub) << 4) & 0x0800) | ((hc >> (8 - Vb)) & 0x0001);
                    Ca = 24;
                }
                break;
            case 3:
                Vb = da[Vb & 0x1f];
                if (Vb)
                {
                    Ub &= 0xff;
                    hc = Ub;
                    Wb = Xb(2);
                    Ub = (Ub >>> Vb) | (Wb << (8 - Vb));
                    if (Vb > 1)
                        Ub |= hc << (9 - Vb);
                    Aa = ic() & ~(0x0800 | 0x0001);
                    Aa |= (((hc ^ Ub) << 4) & 0x0800) | ((hc >> (Vb - 1)) & 0x0001);
                    Ca = 24;
                }
                break;
            case 4:
            case 6:
                Vb &= 0x1f;
                if (Vb)
                {
                    Aa = Ub << (Vb - 1);
                    Ba = Ub = Ub << Vb;
                    Ca = 15;
                }
                break;
            case 5:
                Vb &= 0x1f;
                if (Vb)
                {
                    Ub &= 0xff;
                    Aa = Ub >>> (Vb - 1);
                    Ba = Ub = Ub >>> Vb;
                    Ca = 18;
                }
                break;
            case 7:
                Vb &= 0x1f;
                if (Vb)
                {
                    Ub = (Ub << 24) >> 24;
                    Aa = Ub >> (Vb - 1);
                    Ba = Ub = Ub >> Vb;
                    Ca = 18;
                }
                break;
            default:
                throw "unsupported shift8=" + La;
        }
        return Ub;
    }
    function jc(La, Ub, Vb)
    {
        var hc, Wb;
        switch (La)
        {
            case 0:
                if (Vb & 0x1f)
                {
                    Vb &= 0xf;
                    Ub &= 0xffff;
                    hc = Ub;
                    Ub = (Ub << Vb) | (Ub >>> (16 - Vb));
                    Aa = ic() & ~(0x0800 | 0x0001);
                    Aa |= (Ub & 0x0001) | (((hc ^ Ub) >> 4) & 0x0800);
                    Ca = 24;
                }
                break;
            case 1:
                if (Vb & 0x1f)
                {
                    Vb &= 0xf;
                    Ub &= 0xffff;
                    hc = Ub;
                    Ub = (Ub >>> Vb) | (Ub << (16 - Vb));
                    Aa = ic() & ~(0x0800 | 0x0001);
                    Aa |= ((Ub >> 15) & 0x0001) | (((hc ^ Ub) >> 4) & 0x0800);
                    Ca = 24;
                }
                break;
            case 2:
                Vb = ca[Vb & 0x1f];
                if (Vb)
                {
                    Ub &= 0xffff;
                    hc = Ub;
                    Wb = Xb(2);
                    Ub = (Ub << Vb) | (Wb << (Vb - 1));
                    if (Vb > 1)
                        Ub |= hc >>> (17 - Vb);
                    Aa = ic() & ~(0x0800 | 0x0001);
                    Aa |= (((hc ^ Ub) >> 4) & 0x0800)
						| ((hc >> (16 - Vb)) & 0x0001);
                    Ca = 24;
                }
                break;
            case 3:
                Vb = ca[Vb & 0x1f];
                if (Vb)
                {
                    Ub &= 0xffff;
                    hc = Ub;
                    Wb = Xb(2);
                    Ub = (Ub >>> Vb) | (Wb << (16 - Vb));
                    if (Vb > 1)
                        Ub |= hc << (17 - Vb);
                    Aa = ic() & ~(0x0800 | 0x0001);
                    Aa |= (((hc ^ Ub) >> 4) & 0x0800) | ((hc >> (Vb - 1)) & 0x0001);
                    Ca = 24;
                }
                break;
            case 4:
            case 6:
                Vb &= 0x1f;
                if (Vb)
                {
                    Aa = Ub << (Vb - 1);
                    Ba = Ub = Ub << Vb;
                    Ca = 16;
                }
                break;
            case 5:
                Vb &= 0x1f;
                if (Vb)
                {
                    Ub &= 0xffff;
                    Aa = Ub >>> (Vb - 1);
                    Ba = Ub = Ub >>> Vb;
                    Ca = 19;
                }
                break;
            case 7:
                Vb &= 0x1f;
                if (Vb)
                {
                    Ub = (Ub << 16) >> 16;
                    Aa = Ub >> (Vb - 1);
                    Ba = Ub = Ub >> Vb;
                    Ca = 19;
                }
                break;
            default:
                throw "unsupported shift16=" + La;
        }
        return Ub;
    }
    function kc(La, Ub, Vb)
    {
        var hc, Wb;
        switch (La)
        {
            case 0:
                Vb &= 0x1f;
                if (Vb)
                {
                    hc = Ub;
                    Ub = (Ub << Vb) | (Ub >>> (32 - Vb));
                    Aa = ic() & ~(0x0800 | 0x0001);
                    Aa |= (Ub & 0x0001) | (((hc ^ Ub) >> 20) & 0x0800);
                    Ca = 24;
                }
                break;
            case 1:
                Vb &= 0x1f;
                if (Vb)
                {
                    hc = Ub;
                    Ub = (Ub >>> Vb) | (Ub << (32 - Vb));
                    Aa = ic() & ~(0x0800 | 0x0001);
                    Aa |= ((Ub >> 31) & 0x0001) | (((hc ^ Ub) >> 20) & 0x0800);
                    Ca = 24;
                }
                break;
            case 2:
                Vb &= 0x1f;
                if (Vb)
                {
                    hc = Ub;
                    Wb = Xb(2);
                    Ub = (Ub << Vb) | (Wb << (Vb - 1));
                    if (Vb > 1)
                        Ub |= hc >>> (33 - Vb);
                    Aa = ic() & ~(0x0800 | 0x0001);
                    Aa |= (((hc ^ Ub) >> 20) & 0x0800)
						| ((hc >> (32 - Vb)) & 0x0001);
                    Ca = 24;
                }
                break;
            case 3:
                Vb &= 0x1f;
                if (Vb)
                {
                    hc = Ub;
                    Wb = Xb(2);
                    Ub = (Ub >>> Vb) | (Wb << (32 - Vb));
                    if (Vb > 1)
                        Ub |= hc << (33 - Vb);
                    Aa = ic() & ~(0x0800 | 0x0001);
                    Aa |= (((hc ^ Ub) >> 20) & 0x0800)
						| ((hc >> (Vb - 1)) & 0x0001);
                    Ca = 24;
                }
                break;
            case 4:
            case 6:
                Vb &= 0x1f;
                if (Vb)
                {
                    Aa = Ub << (Vb - 1);
                    Ba = Ub = Ub << Vb;
                    Ca = 17;
                }
                break;
            case 5:
                Vb &= 0x1f;
                if (Vb)
                {
                    Aa = Ub >>> (Vb - 1);
                    Ba = Ub = Ub >>> Vb;
                    Ca = 20;
                }
                break;
            case 7:
                Vb &= 0x1f;
                if (Vb)
                {
                    Aa = Ub >> (Vb - 1);
                    Ba = Ub = Ub >> Vb;
                    Ca = 20;
                }
                break;
            default:
                throw "unsupported shift32=" + La;
        }
        return Ub;
    }
    function lc(Ub, Vb, mc)
    {
        mc &= 0x1f;
        if (mc)
        {
            Aa = Ub << (mc - 1);
            Ba = Ub = (Ub << mc) | (Vb >>> (32 - mc));
            Ca = 17;
        }
        return Ub;
    }
    function nc(Ub, Vb, mc)
    {
        mc &= 0x1f;
        if (mc)
        {
            Aa = Ub >> (mc - 1);
            Ba = Ub = (Ub >>> mc) | (Vb << (32 - mc));
            Ca = 20;
        }
        return Ub;
    }
    function oc(Ub, Vb)
    {
        Vb &= 0x1f;
        Aa = Ub >> Vb;
        Ca = 20;
    }
    function pc(Ub, Vb)
    {
        Vb &= 0x1f;
        Aa = Ub >> Vb;
        Ub |= (1 << Vb);
        Ca = 20;
        return Ub;
    }
    function qc(Ub, Vb)
    {
        Vb &= 0x1f;
        Aa = Ub >> Vb;
        Ub &= ~(1 << Vb);
        Ca = 20;
        return Ub;
    }
    function rc(Ub, Vb)
    {
        Vb &= 0x1f;
        Aa = Ub >> Vb;
        Ub ^= (1 << Vb);
        Ca = 20;
        return Ub;
    }
    function sc(Ub, Vb)
    {
        if (Vb)
        {
            Ub = 0;
            while ((Vb & 1) == 0)
            {
                Ub++;
                Vb >>= 1;
            }
            Ba = 1;
        } else
        {
            Ba = 0;
        }
        Ca = 14;
        return Ub;
    }
    function tc(Ub, Vb)
    {
        if (Vb)
        {
            Ub = 31;
            while (Vb >= 0)
            {
                Ub--;
                Vb <<= 1;
            }
            Ba = 1;
        } else
        {
            Ba = 0;
        }
        Ca = 14;
        return Ub;
    }
    function uc(b)
    {
        var a, q, r;
        a = za[0] & 0xffff;
        b &= 0xff;
        if ((a >> 8) >= b)
            vc(0);
        q = (a / b) & -1;
        r = (a % b);
        Sb(0, (q & 0xff) | (r << 8));
    }
    function wc(b)
    {
        var a, q, r;
        a = (za[0] << 16) >> 16;
        b = (b << 24) >> 24;
        if (b == 0)
            vc(0);
        q = (a / b) & -1;
        if (((q << 24) >> 24) != q)
            vc(0);
        r = (a % b);
        Sb(0, (q & 0xff) | (r << 8));
    }
    function xc(b)
    {
        var a, q, r;
        a = (za[2] << 16) | (za[0] & 0xffff);
        b &= 0xffff;
        if ((a >>> 16) >= b)
            vc(0);
        q = (a / b) & -1;
        r = (a % b);
        Sb(0, q);
        Sb(2, r);
    }
    function yc(b)
    {
        var a, q, r;
        a = (za[2] << 16) | (za[0] & 0xffff);
        b = (b << 16) >> 16;
        if (b == 0)
            vc(0);
        q = (a / b) & -1;
        if (((q << 16) >> 16) != q)
            vc(0);
        r = (a % b);
        Sb(0, q);
        Sb(2, r);
    }
    function zc(Ac, Bc, b)
    {
        var a, i, Cc;
        Ac = Ac >>> 0;
        Bc = Bc >>> 0;
        b = b >>> 0;
        if (Ac >= b)
        {
            vc(0);
        }
        if (Ac >= 0 && Ac <= 0x200000)
        {
            a = Ac * 4294967296 + Bc;
            Oa = (a % b) & -1;
            return (a / b) & -1;
        } else
        {
            for (i = 0; i < 32; i++)
            {
                Cc = Ac >> 31;
                Ac = ((Ac << 1) | (Bc >>> 31)) >>> 0;
                if (Cc || Ac >= b)
                {
                    Ac = Ac - b;
                    Bc = (Bc << 1) | 1;
                } else
                {
                    Bc = Bc << 1;
                }
            }
            Oa = Ac & -1;
            return Bc;
        }
    }
    function Dc(Ac, Bc, b)
    {
        var Ec, Fc, q;
        if (Ac < 0)
        {
            Ec = 1;
            Ac = ~Ac;
            Bc = (-Bc) & -1;
            if (Bc == 0)
                Ac = (Ac + 1) & -1;
        } else
        {
            Ec = 0;
        }
        if (b < 0)
        {
            b = -b & -1;
            Fc = 1;
        } else
        {
            Fc = 0;
        }
        q = zc(Ac, Bc, b);
        Fc ^= Ec;
        if (Fc)
        {
            if ((q >>> 0) > 0x80000000)
                vc(0);
            q = (-q) & -1;
        } else
        {
            if ((q >>> 0) >= 0x80000000)
                vc(0);
        }
        if (Ec)
        {
            Oa = (-Oa) & -1;
        }
        return q;
    }
    function Gc(a, b)
    {
        a &= 0xff;
        b &= 0xff;
        Ba = (za[0] & 0xff) * (b & 0xff);
        Aa = Ba >> 8;
        Ca = 21;
        return Ba;
    }
    function Hc(a, b)
    {
        a = (a << 24) >> 24;
        b = (b << 24) >> 24;
        Ba = (a * b) & -1;
        Aa = (Ba != ((Ba << 24) >> 24)) >> 0;
        Ca = 21;
        return Ba;
    }
    function Ic(a, b)
    {
        Ba = ((a & 0xffff) * (b & 0xffff)) & -1;
        Aa = Ba >>> 16;
        Ca = 22;
        return Ba;
    }
    function Jc(a, b)
    {
        a = (a << 16) >> 16;
        b = (b << 16) >> 16;
        Ba = (a * b) & -1;
        Aa = (Ba != ((Ba << 16) >> 16)) >> 0;
        Ca = 22;
        return Ba;
    }
    function Kc(a, b)
    {
        var r, Bc, Ac, Lc, Mc, m;
        a = a >>> 0;
        b = b >>> 0;
        r = a * b;
        if (r <= 0xffffffff)
        {
            Oa = 0;
            r &= -1;
        } else
        {
            Bc = a & 0xffff;
            Ac = a >>> 16;
            Lc = b & 0xffff;
            Mc = b >>> 16;
            r = Bc * Lc;
            Oa = Ac * Mc;
            m = Bc * Mc;
            r += (((m & 0xffff) << 16) >>> 0);
            Oa += (m >>> 16);
            if (r >= 4294967296)
            {
                r -= 4294967296;
                Oa++;
            }
            m = Ac * Lc;
            r += (((m & 0xffff) << 16) >>> 0);
            Oa += (m >>> 16);
            if (r >= 4294967296)
            {
                r -= 4294967296;
                Oa++;
            }
            r &= -1;
            Oa &= -1;
        }
        return r;
    }
    function Nc(a, b)
    {
        Ba = Kc(a, b);
        Aa = Oa;
        Ca = 23;
        return Ba;
    }
    function Oc(a, b)
    {
        var s, r;
        s = 0;
        if (a < 0)
        {
            a = -a;
            s = 1;
        }
        if (b < 0)
        {
            b = -b;
            s ^= 1;
        }
        r = Kc(a, b);
        if (s)
        {
            Oa = ~Oa;
            r = (-r) & -1;
            if (r == 0)
            {
                Oa = (Oa + 1) & -1;
            }
        }
        Ba = r;
        Aa = (Oa - (r >> 31)) & -1;
        Ca = 23;
        return r;
    }
    function Pc(Ca)
    {
        var Ub, Qc;
        switch (Ca)
        {
            case 0:
                Qc = (Ba & 0xff) < (Aa & 0xff);
                break;
            case 1:
                Qc = (Ba & 0xffff) < (Aa & 0xffff);
                break;
            case 2:
                Qc = (Ba >>> 0) < (Aa >>> 0);
                break;
            case 3:
                Qc = (Ba & 0xff) <= (Aa & 0xff);
                break;
            case 4:
                Qc = (Ba & 0xffff) <= (Aa & 0xffff);
                break;
            case 5:
                Qc = (Ba >>> 0) <= (Aa >>> 0);
                break;
            case 6:
                Qc = ((Ba + Aa) & 0xff) < (Aa & 0xff);
                break;
            case 7:
                Qc = ((Ba + Aa) & 0xffff) < (Aa & 0xffff);
                break;
            case 8:
                Qc = ((Ba + Aa) >>> 0) < (Aa >>> 0);
                break;
            case 9:
                Ub = (Ba + Aa + 1) & 0xff;
                Qc = Ub <= (Aa & 0xff);
                break;
            case 10:
                Ub = (Ba + Aa + 1) & 0xffff;
                Qc = Ub <= (Aa & 0xffff);
                break;
            case 11:
                Ub = (Ba + Aa + 1) >>> 0;
                Qc = Ub <= (Aa >>> 0);
                break;
            case 12:
            case 13:
            case 14:
                Qc = 0;
                break;
            case 15:
                Qc = (Aa >> 7) & 1;
                break;
            case 16:
                Qc = (Aa >> 15) & 1;
                break;
            case 17:
                Qc = (Aa >> 31) & 1;
                break;
            case 18:
            case 19:
            case 20:
                Qc = Aa & 1;
                break;
            case 21:
            case 22:
            case 23:
                Qc = Aa != 0;
                break;
            case 24:
                Qc = Aa & 1;
                break;
            default:
                throw "GET_CARRY: unsupported cc_op=" + Ca;
        }
        return Qc;
    }
    function Xb(Rc)
    {
        var Qc, Ub;
        switch (Rc >> 1)
        {
            case 0:
                switch (Ca)
                {
                    case 0:
                        Ub = (Ba - Aa) & -1;
                        Qc = (((Ub ^ Aa ^ -1) & (Ub ^ Ba)) >> 7) & 1;
                        break;
                    case 1:
                        Ub = (Ba - Aa) & -1;
                        Qc = (((Ub ^ Aa ^ -1) & (Ub ^ Ba)) >> 15) & 1;
                        break;
                    case 2:
                        Ub = (Ba - Aa) & -1;
                        Qc = (((Ub ^ Aa ^ -1) & (Ub ^ Ba)) >> 31) & 1;
                        break;
                    case 3:
                        Ub = (Ba - Aa - 1) & -1;
                        Qc = (((Ub ^ Aa ^ -1) & (Ub ^ Ba)) >> 7) & 1;
                        break;
                    case 4:
                        Ub = (Ba - Aa - 1) & -1;
                        Qc = (((Ub ^ Aa ^ -1) & (Ub ^ Ba)) >> 15) & 1;
                        break;
                    case 5:
                        Ub = (Ba - Aa - 1) & -1;
                        Qc = (((Ub ^ Aa ^ -1) & (Ub ^ Ba)) >> 31) & 1;
                        break;
                    case 6:
                        Ub = (Ba + Aa) & -1;
                        Qc = (((Ub ^ Aa) & (Ub ^ Ba)) >> 7) & 1;
                        break;
                    case 7:
                        Ub = (Ba + Aa) & -1;
                        Qc = (((Ub ^ Aa) & (Ub ^ Ba)) >> 15) & 1;
                        break;
                    case 8:
                        Ub = (Ba + Aa) & -1;
                        Qc = (((Ub ^ Aa) & (Ub ^ Ba)) >> 31) & 1;
                        break;
                    case 9:
                        Ub = (Ba + Aa + 1) & -1;
                        Qc = (((Ub ^ Aa) & (Ub ^ Ba)) >> 7) & 1;
                        break;
                    case 10:
                        Ub = (Ba + Aa + 1) & -1;
                        Qc = (((Ub ^ Aa) & (Ub ^ Ba)) >> 15) & 1;
                        break;
                    case 11:
                        Ub = (Ba + Aa + 1) & -1;
                        Qc = (((Ub ^ Aa) & (Ub ^ Ba)) >> 31) & 1;
                        break;
                    case 12:
                    case 13:
                    case 14:
                        Qc = 0;
                        break;
                    case 15:
                    case 18:
                        Qc = ((Aa ^ Ba) >> 7) & 1;
                        break;
                    case 16:
                    case 19:
                        Qc = ((Aa ^ Ba) >> 15) & 1;
                        break;
                    case 17:
                    case 20:
                        Qc = ((Aa ^ Ba) >> 31) & 1;
                        break;
                    case 21:
                    case 22:
                    case 23:
                        Qc = Aa != 0;
                        break;
                    case 24:
                        Qc = (Aa >> 11) & 1;
                        break;
                    case 25:
                        Qc = (Ea & 0xff) == 0x80;
                        break;
                    case 26:
                        Qc = (Ea & 0xffff) == 0x8000;
                        break;
                    case 27:
                        Qc = (Ea == -2147483648);
                        break;
                    case 28:
                        Qc = (Ea & 0xff) == 0x7f;
                        break;
                    case 29:
                        Qc = (Ea & 0xffff) == 0x7fff;
                        break;
                    case 30:
                        Qc = Ea == 0x7fffffff;
                        break;
                    default:
                        throw "JO: unsupported cc_op=" + Ca;
                }
                break;
            case 1:
                if (Ca >= 25)
                {
                    Qc = Pc(Da);
                } else
                {
                    Qc = Pc(Ca);
                }
                break;
            case 2:
                switch (Ca)
                {
                    case 0:
                    case 3:
                    case 6:
                    case 9:
                    case 12:
                    case 15:
                    case 18:
                    case 21:
                        Qc = (Ba & 0xff) == 0;
                        break;
                    case 1:
                    case 4:
                    case 7:
                    case 10:
                    case 13:
                    case 16:
                    case 19:
                    case 22:
                        Qc = (Ba & 0xffff) == 0;
                        break;
                    case 2:
                    case 5:
                    case 8:
                    case 11:
                    case 14:
                    case 17:
                    case 20:
                    case 23:
                        Qc = Ba == 0;
                        break;
                    case 24:
                        Qc = (Aa >> 6) & 1;
                        break;
                    case 25:
                    case 28:
                        Qc = (Ea & 0xff) == 0;
                        break;
                    case 26:
                    case 29:
                        Qc = (Ea & 0xffff) == 0;
                        break;
                    case 27:
                    case 30:
                        Qc = Ea == 0;
                        break;
                    default:
                        throw "JZ: unsupported cc_op=" + Ca;
                }
                ;
                break;
            case 3:
                switch (Ca)
                {
                    case 6:
                        Qc = ((Ba + Aa) & 0xff) <= (Aa & 0xff);
                        break;
                    case 7:
                        Qc = ((Ba + Aa) & 0xffff) <= (Aa & 0xffff);
                        break;
                    case 8:
                        Qc = ((Ba + Aa) >>> 0) <= (Aa >>> 0);
                        break;
                    case 24:
                        Qc = (Aa & (0x0040 | 0x0001)) != 0;
                        break;
                    default:
                        Qc = Xb(2) | Xb(4);
                        break;
                }
                break;
            case 4:
                switch (Ca)
                {
                    case 0:
                    case 3:
                    case 6:
                    case 9:
                    case 12:
                    case 15:
                    case 18:
                    case 21:
                        Qc = (Ba >> 7) & 1;
                        break;
                    case 1:
                    case 4:
                    case 7:
                    case 10:
                    case 13:
                    case 16:
                    case 19:
                    case 22:
                        Qc = (Ba >> 15) & 1;
                        break;
                    case 2:
                    case 5:
                    case 8:
                    case 11:
                    case 14:
                    case 17:
                    case 20:
                    case 23:
                        Qc = Ba < 0;
                        break;
                    case 24:
                        Qc = (Aa >> 7) & 1;
                        break;
                    case 25:
                    case 28:
                        Qc = (Ea >> 7) & 1;
                        break;
                    case 26:
                    case 29:
                        Qc = (Ea >> 15) & 1;
                        break;
                    case 27:
                    case 30:
                        Qc = Ea < 0;
                        break;
                    default:
                        throw "JS: unsupported cc_op=" + Ca;
                }
                break;
            case 5:
                switch (Ca)
                {
                    case 0:
                    case 3:
                    case 6:
                    case 9:
                    case 12:
                    case 15:
                    case 18:
                    case 21:
                    case 1:
                    case 4:
                    case 7:
                    case 10:
                    case 13:
                    case 16:
                    case 19:
                    case 22:
                    case 2:
                    case 5:
                    case 8:
                    case 11:
                    case 14:
                    case 17:
                    case 20:
                    case 23:
                        Qc = ba[Ba & 0xff];
                        break;
                    case 24:
                        Qc = (Aa >> 2) & 1;
                        break;
                    case 25:
                    case 28:
                    case 26:
                    case 29:
                    case 27:
                    case 30:
                        Qc = ba[Ea & 0xff];
                        break;
                    default:
                        throw "JP: unsupported cc_op=" + Ca;
                }
                break;
            case 6:
                switch (Ca)
                {
                    case 6:
                        Qc = ((Ba + Aa) << 24) < (Aa << 24);
                        break;
                    case 7:
                        Qc = ((Ba + Aa) << 16) < (Aa << 16);
                        break;
                    case 8:
                        Qc = ((Ba + Aa) & -1) < Aa;
                        break;
                    case 12:
                        Qc = (Ba << 24) < 0;
                        break;
                    case 13:
                        Qc = (Ba << 16) < 0;
                        break;
                    case 14:
                        Qc = Ba < 0;
                        break;
                    case 24:
                        Qc = ((Aa >> 7) ^ (Aa >> 11)) & 1;
                        break;
                    case 25:
                    case 28:
                        Qc = (Ea << 24) < 0;
                        break;
                    case 26:
                    case 29:
                        Qc = (Ea << 16) < 0;
                        break;
                    case 27:
                    case 30:
                        Qc = Ea < 0;
                        break;
                    default:
                        Qc = Xb(8) ^ Xb(0);
                        break;
                }
                break;
            case 7:
                switch (Ca)
                {
                    case 6:
                        Qc = ((Ba + Aa) << 24) <= (Aa << 24);
                        break;
                    case 7:
                        Qc = ((Ba + Aa) << 16) <= (Aa << 16);
                        break;
                    case 8:
                        Qc = ((Ba + Aa) & -1) <= Aa;
                        break;
                    case 12:
                        Qc = (Ba << 24) <= 0;
                        break;
                    case 13:
                        Qc = (Ba << 16) <= 0;
                        break;
                    case 14:
                        Qc = Ba <= 0;
                        break;
                    case 24:
                        Qc = (((Aa >> 7) ^ (Aa >> 11)) | (Aa >> 6)) & 1;
                        break;
                    case 25:
                    case 28:
                        Qc = (Ea << 24) <= 0;
                        break;
                    case 26:
                    case 29:
                        Qc = (Ea << 16) <= 0;
                        break;
                    case 27:
                    case 30:
                        Qc = Ea <= 0;
                        break;
                    default:
                        Qc = (Xb(8) ^ Xb(0)) | Xb(4);
                        break;
                }
                break;
            default:
                throw "unsupported cond: " + Rc;
        }
        return Qc ^ (Rc & 1);
    }
    function ic()
    {
        return (Xb(2) << 0) | (Xb(10) << 2) | (Xb(4) << 6) | (Xb(8) << 7)
				| (Xb(0) << 11);
    }
    function Sc()
    {
        var Tc;
        Tc = ic();
        Tc |= ya.df & 0x00000400;
        Tc |= ya.eflags;
        return Tc;
    }
    function Uc(Tc, Vc)
    {
        Ca = 24;
        Aa = Tc & (0x0800 | 0x0080 | 0x0040 | 0x0010 | 0x0004 | 0x0001);
        ya.df = 1 - (2 * ((Tc >> 10) & 1));
        ya.eflags = (ya.eflags & ~Vc) | (Tc & Vc);
    }
    function Wc()
    {
        return ya.cycle_count + (xa - Ma);
    }
    function Xc(va)
    {
        throw "CPU abort: " + va;
    }
    function Yc()
    {
        ya.eip = Ib;
        ya.cc_src = Aa;
        ya.cc_dst = Ba;
        ya.cc_op = Ca;
        ya.cc_op2 = Da;
        ya.cc_dst2 = Ea;
        ya.dump();
    }
    function Zc(intno, error_code)
    {
        throw {
            intno: intno,
            error_code: error_code
        };
    }
    function vc(intno)
    {
        Zc(intno, 0);
    }
    function ad(bd)
    {
        ya.cpl = bd;
        if (ya.cpl == 3)
        {
            Za = Xa;
            ab = Ya;
        } else
        {
            Za = Va;
            ab = Wa;
        }
    }
    function cd(ha, dd)
    {
        var cb;
        if (dd)
        {
            cb = ab[ha >>> 12];
        } else
        {
            cb = Za[ha >>> 12];
        }
        if (cb == -1)
        {
            db(ha, dd, ya.cpl == 3);
            if (dd)
            {
                cb = ab[ha >>> 12];
            } else
            {
                cb = Za[ha >>> 12];
            }
        }
        return cb ^ ha;
    }
    function ed()
    {
        var fd, l, gd, hd, i, id;
        fd = za[1] >>> 0;
        l = (4096 - (za[6] & 0xfff)) >> 2;
        if (fd > l)
            fd = l;
        l = (4096 - (za[7] & 0xfff)) >> 2;
        if (fd > l)
            fd = l;
        if (fd)
        {
            gd = cd(za[6], 0);
            hd = cd(za[7], 1);
            hd >>= 2;
            gd >>= 2;
            for (i = 0; i < fd; i++)
                Ta[hd + i] = Ta[gd + i];
            id = fd << 2;
            za[6] = (za[6] + id) & -1;
            za[7] = (za[7] + id) & -1;
            za[1] = (za[1] - fd) & -1;
            return true;
        }
        return false;
    }
    function jd()
    {
        var fd, l, hd, i, id, ia;
        fd = za[1] >>> 0;
        l = (4096 - (za[7] & 0xfff)) >> 2;
        if (fd > l)
            fd = l;
        if (fd)
        {
            hd = cd(za[7], 1);
            hd >>= 2;
            ia = za[0];
            for (i = 0; i < fd; i++)
                Ta[hd + i] = ia;
            id = fd << 2;
            za[7] = (za[7] + id) & -1;
            za[1] = (za[1] - fd) & -1;
            return true;
        }
        return false;
    }
    function db(kd, ld, la)
    {
        var md, nd, error_code, od, pd, qd, rd, dd, sd;
        if (!(ya.cr0 & (1 << 31)))
        {
            ya.tlb_set_page(kd & -4096, kd & -4096, 1);
        } else
        {
            md = (ya.cr3 & -4096) + ((kd >> 20) & 0xffc);
            nd = ya.ld32_phys(md);
            if (!(nd & 0x00000001))
            {
                error_code = 0;
            } else
            {
                if (!(nd & 0x00000020))
                {
                    nd |= 0x00000020;
                    ya.st32_phys(md, nd);
                }
                od = (nd & -4096) + ((kd >> 10) & 0xffc);
                pd = ya.ld32_phys(od);
                if (!(pd & 0x00000001))
                {
                    error_code = 0;
                } else
                {
                    qd = pd & nd;
                    if (la && !(qd & 0x00000004))
                    {
                        error_code = 0x01;
                    } else if (ld && !(qd & 0x00000002))
                    {
                        error_code = 0x01;
                    } else
                    {
                        rd = (ld && !(pd & 0x00000040));
                        if (!(pd & 0x00000020) || rd)
                        {
                            pd |= 0x00000020;
                            if (rd)
                                pd |= 0x00000040;
                            ya.st32_phys(od, pd);
                        }
                        dd = 0;
                        if ((pd & 0x00000040) && (qd & 0x00000002))
                            dd = 1;
                        sd = 0;
                        if (qd & 0x00000004)
                            sd = 1;
                        ya.tlb_set_page(kd & -4096, pd & -4096, dd, sd);
                        return;
                    }
                }
            }
            error_code |= ld << 1;
            if (la)
                error_code |= 0x04;
            ya.cr2 = kd;
            Zc(14, error_code);
        }
    }
    function td(ud)
    {
        if (!(ud & (1 << 0)))
            Xc("real mode not supported");
        if ((ud & ((1 << 31) | (1 << 16) | (1 << 0))) != (ya.cr0 & ((1 << 31)
				| (1 << 16) | (1 << 0))))
        {
            ya.tlb_flush_all();
        }
        ya.cr0 = ud | (1 << 4);
    }
    function vd(wd)
    {
        ya.cr3 = wd;
        if (ya.cr0 & (1 << 31))
        {
            ya.tlb_flush_all();
        }
    }
    function xd(yd)
    {
        ya.cr4 = yd;
    }
    function zd(Ad)
    {
        if (Ad & (1 << 22))
            return -1;
        else
            return 0xffff;
    }
    function Bd(selector)
    {
        var ua, Pb, Cd, Ad;
        if (selector & 0x4)
            ua = ya.ldt;
        else
            ua = ya.gdt;
        Pb = selector & ~7;
        if ((Pb + 7) > ua.limit)
            return null;
        ha = ua.base + Pb;
        Cd = Ab();
        ha += 4;
        Ad = Ab();
        return [Cd, Ad];
    }
    function Dd(Cd, Ad)
    {
        var limit;
        limit = (Cd & 0xffff) | (Ad & 0x000f0000);
        if (Ad & (1 << 23))
            limit = (limit << 12) | 0xfff;
        return limit;
    }
    function Ed(Cd, Ad)
    {
        return (((Cd >>> 16) | ((Ad & 0xff) << 16) | (Ad & 0xff000000))) & -1;
    }
    function Fd(ua, Cd, Ad)
    {
        ua.base = Ed(Cd, Ad);
        ua.limit = Dd(Cd, Ad);
        ua.flags = Ad;
    }
    function Gd(Hd, selector, base, limit, flags)
    {
        ya.segs[Hd] = {
            selector: selector,
            base: base,
            limit: limit,
            flags: flags
        };
    }
    function Id(Jd)
    {
        var Kd, Pb, Ld, Md, Nd;
        if (!(ya.tr.flags & (1 << 15)))
            Xc("invalid tss");
        Kd = (ya.tr.flags >> 8) & 0xf;
        if ((Kd & 7) != 1)
            Xc("invalid tss type");
        Ld = Kd >> 3;
        Pb = (Jd * 4 + 2) << Ld;
        if (Pb + (4 << Ld) - 1 > ya.tr.limit)
            Zc(10, ya.tr.selector & 0xfffc);
        ha = (ya.tr.base + Pb) & -1;
        if (Ld == 0)
        {
            Nd = yb();
            ha += 2;
        } else
        {
            Nd = Ab();
            ha += 4;
        }
        Md = yb();
        return [Md, Nd];
    }
    function Od(intno, Pd, error_code, Qd, Rd)
    {
        var ua, Sd, Kd, Jd, selector, Td, Ud;
        var Vd, Wd, Ld;
        var e, Cd, Ad, Xd, Md, Nd, Yd, Zd;
        var ae, be;
        if (intno == 0x06)
        {
            var ce = Ib;
            va = "do_interrupt: intno=" + sa(intno) + " error_code="
					+ ra(error_code) + " EIP=" + ra(ce) + " ESP=" + ra(za[4])
					+ " EAX=" + ra(za[0]) + " EBX=" + ra(za[3]) + " ECX="
					+ ra(za[1]);
            if (intno == 0x0e)
            {
                va += " CR2=" + ra(ya.cr2);
            }
            console.log(va);
            if (intno == 0x06)
            {
                var va, i, n;
                va = "Code:";
                n = 4096 - (ce & 0xfff);
                if (n > 15)
                    n = 15;
                for (i = 0; i < n; i++)
                {
                    ha = (ce + i) & -1;
                    va += " " + sa(eb());
                }
                console.log(va);
            }
        }
        Vd = 0;
        if (!Pd && !Rd)
        {
            switch (intno)
            {
                case 8:
                case 10:
                case 11:
                case 12:
                case 13:
                case 14:
                case 17:
                    Vd = 1;
                    break;
            }
        }
        if (Pd)
            ae = Qd;
        else
            ae = Ib;
        ua = ya.idt;
        if (intno * 8 + 7 > ua.limit)
            Zc(13, intno * 8 + 2);
        ha = (ua.base + intno * 8) & -1;
        Cd = Ab();
        ha += 4;
        Ad = Ab();
        Kd = (Ad >> 8) & 0x1f;
        switch (Kd)
        {
            case 5:
            case 7:
            case 6:
                throw "unsupported task gate";
            case 14:
            case 15:
                break;
            default:
                Zc(13, intno * 8 + 2);
                break;
        }
        Jd = (Ad >> 13) & 3;
        Ud = ya.cpl;
        if (Pd && Jd < Ud)
            Zc(13, intno * 8 + 2);
        if (!(Ad & (1 << 15)))
            Zc(11, intno * 8 + 2);
        selector = Cd >> 16;
        Xd = (Ad & -65536) | (Cd & 0x0000ffff);
        if ((selector & 0xfffc) == 0)
            Zc(13, 0);
        e = Bd(selector);
        if (!e)
            Zc(13, selector & 0xfffc);
        Cd = e[0];
        Ad = e[1];
        if (!(Ad & (1 << 12)) || !(Ad & ((1 << 11))))
            Zc(13, selector & 0xfffc);
        Jd = (Ad >> 13) & 3;
        if (Jd > Ud)
            Zc(13, selector & 0xfffc);
        if (!(Ad & (1 << 15)))
            Zc(11, selector & 0xfffc);
        if (!(Ad & (1 << 10)) && Jd < Ud)
        {
            e = Id(Jd);
            Md = e[0];
            Nd = e[1];
            if ((Md & 0xfffc) == 0)
                Zc(10, Md & 0xfffc);
            if ((Md & 3) != Jd)
                Zc(10, Md & 0xfffc);
            e = Bd(Md);
            if (!e)
                Zc(10, Md & 0xfffc);
            Yd = e[0];
            Zd = e[1];
            Td = (Zd >> 13) & 3;
            if (Td != Jd)
                Zc(10, Md & 0xfffc);
            if (!(Zd & (1 << 12)) || (Zd & (1 << 11)) || !(Zd & (1 << 9)))
                Zc(10, Md & 0xfffc);
            if (!(Zd & (1 << 15)))
                Zc(10, Md & 0xfffc);
            Wd = 1;
            be = zd(Zd);
            Sd = Ed(Yd, Zd);
        } else if ((Ad & (1 << 10)) || Jd == Ud)
        {
            if (ya.eflags & 0x00020000)
                Zc(13, selector & 0xfffc);
            Wd = 0;
            be = zd(ya.segs[2].flags);
            Sd = ya.segs[2].base;
            Nd = za[4];
            Jd = Ud;
        } else
        {
            Zc(13, selector & 0xfffc);
            Wd = 0;
            be = 0;
            Sd = 0;
            Nd = 0;
        }
        Ld = Kd >> 3;
        if (Wd)
        {
            if (ya.eflags & 0x00020000)
            {
                {
                    Nd = (Nd - 4) & -1;
                    ha = (Sd + (Nd & be)) & -1;
                    Gb(ya.segs[5].selector);
                }
                ;
                {
                    Nd = (Nd - 4) & -1;
                    ha = (Sd + (Nd & be)) & -1;
                    Gb(ya.segs[4].selector);
                }
                ;
                {
                    Nd = (Nd - 4) & -1;
                    ha = (Sd + (Nd & be)) & -1;
                    Gb(ya.segs[3].selector);
                }
                ;
                {
                    Nd = (Nd - 4) & -1;
                    ha = (Sd + (Nd & be)) & -1;
                    Gb(ya.segs[0].selector);
                }
                ;
            }
            {
                Nd = (Nd - 4) & -1;
                ha = (Sd + (Nd & be)) & -1;
                Gb(ya.segs[2].selector);
            }
            ;
            {
                Nd = (Nd - 4) & -1;
                ha = (Sd + (Nd & be)) & -1;
                Gb(za[4]);
            }
            ;
        }
        {
            Nd = (Nd - 4) & -1;
            ha = (Sd + (Nd & be)) & -1;
            Gb(Sc());
        }
        ;
        {
            Nd = (Nd - 4) & -1;
            ha = (Sd + (Nd & be)) & -1;
            Gb(ya.segs[1].selector);
        }
        ;
        {
            Nd = (Nd - 4) & -1;
            ha = (Sd + (Nd & be)) & -1;
            Gb(ae);
        }
        ;
        if (Vd)
        {
            {
                Nd = (Nd - 4) & -1;
                ha = (Sd + (Nd & be)) & -1;
                Gb(error_code);
            }
            ;
        }
        if (Wd)
        {
            if (ya.eflags & 0x00020000)
            {
                Gd(0, 0, 0, 0, 0);
                Gd(3, 0, 0, 0, 0);
                Gd(4, 0, 0, 0, 0);
                Gd(5, 0, 0, 0, 0);
            }
            Md = (Md & ~3) | Jd;
            Gd(2, Md, Sd, Dd(Yd, Zd), Zd);
        }
        za[4] = (za[4] & ~(be)) | ((Nd) & (be));
        selector = (selector & ~3) | Jd;
        Gd(1, selector, Ed(Cd, Ad), Dd(Cd, Ad), Ad);
        ad(Jd);
        Hb = Xd;
        if ((Kd & 1) == 0)
        {
            ya.eflags &= ~0x00000200;
        }
        ya.eflags &= ~(0x00000100 | 0x00020000 | 0x00010000 | 0x00004000);
    }
    function de(selector)
    {
        var ua, Cd, Ad, Pb, ee;
        selector &= 0xffff;
        if ((selector & 0xfffc) == 0)
        {
            ya.ldt.base = 0;
            ya.ldt.limit = 0;
        } else
        {
            if (selector & 0x4)
                Zc(13, selector & 0xfffc);
            ua = ya.gdt;
            Pb = selector & ~7;
            ee = 7;
            if ((Pb + ee) > ua.limit)
                Zc(13, selector & 0xfffc);
            ha = (ua.base + Pb) & -1;
            Cd = Ab();
            ha += 4;
            Ad = Ab();
            if ((Ad & (1 << 12)) || ((Ad >> 8) & 0xf) != 2)
                Zc(13, selector & 0xfffc);
            if (!(Ad & (1 << 15)))
                Zc(11, selector & 0xfffc);
            Fd(ya.ldt, Cd, Ad);
        }
        ya.ldt.selector = selector;
    }
    function fe(selector)
    {
        var ua, Cd, Ad, Pb, Kd, ee;
        selector &= 0xffff;
        if ((selector & 0xfffc) == 0)
        {
            ya.tr.base = 0;
            ya.tr.limit = 0;
            ya.tr.flags = 0;
        } else
        {
            if (selector & 0x4)
                Zc(13, selector & 0xfffc);
            ua = ya.gdt;
            Pb = selector & ~7;
            ee = 7;
            if ((Pb + ee) > ua.limit)
                Zc(13, selector & 0xfffc);
            ha = (ua.base + Pb) & -1;
            Cd = Ab();
            ha += 4;
            Ad = Ab();
            Kd = (Ad >> 8) & 0xf;
            if ((Ad & (1 << 12)) || (Kd != 1 && Kd != 9))
                Zc(13, selector & 0xfffc);
            if (!(Ad & (1 << 15)))
                Zc(11, selector & 0xfffc);
            Fd(ya.tr, Cd, Ad);
            Ad |= (1 << 9);
            Gb(Ad);
        }
        ya.tr.selector = selector;
    }
    function ge(he, selector)
    {
        var Cd, Ad, Ud, Jd, ie, ua, Pb;
        selector &= 0xffff;
        Ud = ya.cpl;
        if ((selector & 0xfffc) == 0)
        {
            if (he == 2)
                Zc(13, 0);
            Gd(he, selector, 0, 0, 0);
        } else
        {
            if (selector & 0x4)
                ua = ya.ldt;
            else
                ua = ya.gdt;
            Pb = selector & ~7;
            if ((Pb + 7) > ua.limit)
                Zc(13, selector & 0xfffc);
            ha = (ua.base + Pb) & -1;
            Cd = Ab();
            ha += 4;
            Ad = Ab();
            if (!(Ad & (1 << 12)))
                Zc(13, selector & 0xfffc);
            ie = selector & 3;
            Jd = (Ad >> 13) & 3;
            if (he == 2)
            {
                if ((Ad & (1 << 11)) || !(Ad & (1 << 9)))
                    Zc(13, selector & 0xfffc);
                if (ie != Ud || Jd != Ud)
                    Zc(13, selector & 0xfffc);
            } else
            {
                if ((Ad & ((1 << 11) | (1 << 9))) == (1 << 11))
                    Zc(13, selector & 0xfffc);
                if (!(Ad & (1 << 11)) || !(Ad & (1 << 10)))
                {
                    if (Jd < Ud || Jd < ie)
                        Zc(13, selector & 0xfffc);
                }
            }
            if (!(Ad & (1 << 15)))
            {
                if (he == 2)
                    Zc(12, selector & 0xfffc);
                else
                    Zc(11, selector & 0xfffc);
            }
            if (!(Ad & (1 << 8)))
            {
                Ad |= (1 << 8);
                Gb(Ad);
            }
            Gd(he, selector, Ed(Cd, Ad), Dd(Cd, Ad), Ad);
        }
    }
    function je(ke, le)
    {
        var me, Kd, Cd, Ad, Ud, Jd, ie, limit, e;
        if ((ke & 0xfffc) == 0)
            Zc(13, 0);
        e = Bd(ke);
        if (!e)
            Zc(13, ke & 0xfffc);
        Cd = e[0];
        Ad = e[1];
        Ud = ya.cpl;
        if (Ad & (1 << 12))
        {
            if (!(Ad & (1 << 11)))
                Zc(13, ke & 0xfffc);
            Jd = (Ad >> 13) & 3;
            if (Ad & (1 << 10))
            {
                if (Jd > Ud)
                    Zc(13, ke & 0xfffc);
            } else
            {
                ie = ke & 3;
                if (ie > Ud)
                    Zc(13, ke & 0xfffc);
                if (Jd != Ud)
                    Zc(13, ke & 0xfffc);
            }
            if (!(Ad & (1 << 15)))
                Zc(11, ke & 0xfffc);
            limit = Dd(Cd, Ad);
            if ((le >>> 0) > (limit >>> 0))
                Zc(13, ke & 0xfffc);
            Gd(1, (ke & 0xfffc) | Ud, Ed(Cd, Ad), limit, Ad);
            Hb = le;
        } else
        {
            Xc("unsupported jump to call or task gate");
        }
    }
    function ne(he, Ud)
    {
        var Jd, Ad;
        if ((he == 4 || he == 5) && (ya.segs[he].selector & 0xfffc) == 0)
            return;
        Ad = ya.segs[he].flags;
        Jd = (Ad >> 13) & 3;
        if (!(Ad & (1 << 11)) || !(Ad & (1 << 10)))
        {
            if (Jd < Ud)
            {
                Gd(he, 0, 0, 0, 0);
            }
        }
    }
    function oe(Ld, pe, qe)
    {
        var ke, re, se;
        var te, ue, ve, we;
        var e, Cd, Ad, Yd, Zd;
        var Ud, Jd, ie, xe, ye;
        var Sd, ze, le, Ae, be;
        be = zd(ya.segs[2].flags);
        ze = za[4];
        Sd = ya.segs[2].base;
        re = 0;
        if (Ld == 1)
        {
            {
                ha = (Sd + (ze & be)) & -1;
                le = ib();
                ze = (ze + 4) & -1;
            }
            ;
            {
                ha = (Sd + (ze & be)) & -1;
                ke = ib();
                ze = (ze + 4) & -1;
            }
            ;
            ke &= 0xffff;
            if (pe)
            {
                {
                    ha = (Sd + (ze & be)) & -1;
                    re = ib();
                    ze = (ze + 4) & -1;
                }
                ;
                if (re & 0x00020000)
                    throw "VM86 unsupported";
            }
        } else
        {
            throw "unsupported";
        }
        if ((ke & 0xfffc) == 0)
            Zc(13, ke & 0xfffc);
        e = Bd(ke);
        if (!e)
            Zc(13, ke & 0xfffc);
        Cd = e[0];
        Ad = e[1];
        if (!(Ad & (1 << 12)) || !(Ad & (1 << 11)))
            Zc(13, ke & 0xfffc);
        Ud = ya.cpl;
        ie = ke & 3;
        if (ie < Ud)
            Zc(13, ke & 0xfffc);
        Jd = (Ad >> 13) & 3;
        if (Ad & (1 << 10))
        {
            if (Jd > ie)
                Zc(13, ke & 0xfffc);
        } else
        {
            if (Jd != ie)
                Zc(13, ke & 0xfffc);
        }
        if (!(Ad & (1 << 15)))
            Zc(11, ke & 0xfffc);
        ze = (ze + qe) & -1;
        if (ie == Ud)
        {
            Gd(1, ke, Ed(Cd, Ad), Dd(Cd, Ad), Ad);
        } else
        {
            if (Ld == 1)
            {
                {
                    ha = (Sd + (ze & be)) & -1;
                    Ae = ib();
                    ze = (ze + 4) & -1;
                }
                ;
                {
                    ha = (Sd + (ze & be)) & -1;
                    se = ib();
                    ze = (ze + 4) & -1;
                }
                ;
                se &= 0xffff;
            } else
            {
                throw "unsupported";
            }
            if ((se & 0xfffc) == 0)
            {
                Zc(13, 0);
            } else
            {
                if ((se & 3) != ie)
                    Zc(13, se & 0xfffc);
                e = Bd(se);
                if (!e)
                    Zc(13, se & 0xfffc);
                Yd = e[0];
                Zd = e[1];
                if (!(Zd & (1 << 12)) || (Zd & (1 << 11)) || !(Zd & (1 << 9)))
                    Zc(13, se & 0xfffc);
                Jd = (Zd >> 13) & 3;
                if (Jd != ie)
                    Zc(13, se & 0xfffc);
                if (!(Zd & (1 << 15)))
                    Zc(11, se & 0xfffc);
                Gd(2, se, Ed(Yd, Zd), Dd(Yd, Zd), Zd);
            }
            Gd(1, ke, Ed(Cd, Ad), Dd(Cd, Ad), Ad);
            ad(ie);
            ze = Ae;
            be = zd(Zd);
            ne(0, ie);
            ne(3, ie);
            ne(4, ie);
            ne(5, ie);
            ze = (ze + qe) & -1;
        }
        za[4] = (za[4] & ~(be)) | ((ze) & (be));
        Hb = le;
        if (pe)
        {
            xe = 0x00000100 | 0x00040000 | 0x00200000 | 0x00010000 | 0x00004000;
            if (Ud == 0)
                xe |= 0x00003000;
            ye = (ya.eflags >> 12) & 3;
            if (Ud <= ye)
                xe |= 0x00000200;
            if (Ld == 0)
                xe &= 0xffff;
            Uc(re, xe);
        }
    }
    function Be(Ld)
    {
        if (ya.eflags & 0x00004000)
        {
            Zc(13, 0);
        } else
        {
            oe(Ld, 1, 0);
        }
    }
    function Ce()
    {
        var Pb;
        Pb = za[0];
        switch (Pb)
        {
            case 0:
                za[0] = 1;
                za[3] = 0x756e6547 & -1;
                za[2] = 0x49656e69 & -1;
                za[1] = 0x6c65746e & -1;
                break;
            case 1:
            default:
                za[0] = (5 << 8) | (4 << 4) | 3;
                za[3] = 8 << 8;
                za[1] = 0;
                za[2] = (1 << 4);
                break;
        }
    }
    ya = this;
    Ra = this.phys_mem8;
    Sa = this.phys_mem16;
    Ta = this.phys_mem32;
    Xa = this.tlb_read_user;
    Ya = this.tlb_write_user;
    Va = this.tlb_read_kernel;
    Wa = this.tlb_write_kernel;
    if (ya.cpl == 3)
    {
        Za = Xa;
        ab = Ya;
    } else
    {
        Za = Va;
        ab = Wa;
    }
    if (ya.halted)
    {
        if (ya.hard_irq != 0 && (ya.eflags & 0x00000200))
        {
            ya.halted = 0;
        } else
        {
            return 257;
        }
    }
    za = this.regs;
    Aa = this.cc_src;
    Ba = this.cc_dst;
    Ca = this.cc_op;
    Da = this.cc_op2;
    Ea = this.cc_dst2;
    Hb = this.eip;
    Na = 256;
    Ma = xa;
    Qa = -1;
    while (Ma)
    {
        try
        {
            if (Qa >= 0)
            {
                Ib = Hb;
                Od(Qa, 0, 0, 0, 1);
                Qa = -1;
            }
            if (ya.hard_irq != 0 && (ya.eflags & 0x00000200))
            {
                Qa = ya.get_hard_intno();
                Ib = Hb;
                Od(Qa, 0, 0, 0, 1);
                Qa = -1;
            }
            De: do
            {
                Ib = Hb;
                Fa = 0;
                b = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb ^ Ua];
                Hb++;
                ;
                if (0)
                {
                    console.log("exec: EIP=" + ra(Ib) + " OPCODE=" + ra(b));
                }
                Ee: for (; ; )
                {
                    switch (b)
                    {
                        case 0x66:
                            Fa |= 0x0100;
                            b = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            b |= (Fa & 0x0100);
                            break;
                        case 0xf0:
                            Fa |= 0x0040;
                            b = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            b |= (Fa & 0x0100);
                            break;
                        case 0xf2:
                            Fa |= 0x0020;
                            b = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            b |= (Fa & 0x0100);
                            break;
                        case 0xf3:
                            Fa |= 0x0010;
                            b = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            b |= (Fa & 0x0100);
                            break;
                        case 0x64:
                            Fa = (Fa & ~0x000f) | (4 + 1);
                            b = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            b |= (Fa & 0x0100);
                            ;
                            break;
                        case 0x65:
                            Fa = (Fa & ~0x000f) | (5 + 1);
                            b = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            b |= (Fa & 0x0100);
                            ;
                            break;
                        case 0xb0:
                        case 0xb1:
                        case 0xb2:
                        case 0xb3:
                        case 0xb4:
                        case 0xb5:
                        case 0xb6:
                        case 0xb7:
                            ia = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            Rb(b & 7, ia);
                            break Ee;
                        case 0xb8:
                        case 0xb9:
                        case 0xba:
                        case 0xbb:
                        case 0xbc:
                        case 0xbd:
                        case 0xbe:
                        case 0xbf:
                            ia = Lb();
                            za[b & 7] = ia;
                            break Ee;
                        case 0x88:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            Ia = (Ga >> 3) & 7;
                            ia = ((za[Ia & 3] >> ((Ia & 4) << 1)) & 0xff);
                            if ((Ga >> 6) == 3)
                            {
                                Rb(Ga & 7, ia);
                            } else
                            {
                                ha = Mb(Ga);
                                {
                                    Ua = ab[ha >>> 12];
                                    if (Ua == -1)
                                    {
                                        pb(ia);
                                    } else
                                    {
                                        Ra[ha ^ Ua] = ia;
                                    }
                                }
                                ;
                            }
                            break Ee;
                        case 0x89:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            ia = za[(Ga >> 3) & 7];
                            if ((Ga >> 6) == 3)
                            {
                                za[Ga & 7] = ia;
                            } else
                            {
                                ha = Mb(Ga);
                                {
                                    Ua = ab[ha >>> 12];
                                    if ((Ua | ha) & 3)
                                    {
                                        tb(ia);
                                    } else
                                    {
                                        Ta[(ha ^ Ua) >> 2] = ia;
                                    }
                                }
                                ;
                            }
                            break Ee;
                        case 0x8a:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            if ((Ga >> 6) == 3)
                            {
                                Ha = Ga & 7;
                                ia = ((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff);
                            } else
                            {
                                ha = Mb(Ga);
                                ia = (((Ua = Za[ha >>> 12]) == -1) ? bb() : Ra[ha
									^ Ua]);
                            }
                            Rb((Ga >> 3) & 7, ia);
                            break Ee;
                        case 0x8b:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            if ((Ga >> 6) == 3)
                            {
                                ia = za[Ga & 7];
                            } else
                            {
                                ha = Mb(Ga);
                                ia = (((Ua = Za[ha >>> 12]) | ha) & 3 ? hb()
									: Ta[(ha ^ Ua) >> 2]);
                            }
                            za[(Ga >> 3) & 7] = ia;
                            break Ee;
                        case 0xa0:
                            ha = Qb();
                            ia = eb();
                            Rb(0, ia);
                            break Ee;
                        case 0xa1:
                            ha = Qb();
                            ia = ib();
                            za[0] = ia;
                            break Ee;
                        case 0xa2:
                            ha = Qb();
                            qb(za[0]);
                            break Ee;
                        case 0xa3:
                            ha = Qb();
                            ub(za[0]);
                            break Ee;
                        case 0xc6:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            if ((Ga >> 6) == 3)
                            {
                                ia = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                Hb++;
                                ;
                                Rb(Ga & 7, ia);
                            } else
                            {
                                ha = Mb(Ga);
                                ia = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                Hb++;
                                ;
                                qb(ia);
                            }
                            break Ee;
                        case 0xc7:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            if ((Ga >> 6) == 3)
                            {
                                ia = Lb();
                                za[Ga & 7] = ia;
                            } else
                            {
                                ha = Mb(Ga);
                                ia = Lb();
                                ub(ia);
                            }
                            break Ee;
                        case 0x91:
                        case 0x92:
                        case 0x93:
                        case 0x94:
                        case 0x95:
                        case 0x96:
                        case 0x97:
                            Ia = b & 7;
                            ia = za[0];
                            za[0] = za[Ia];
                            za[Ia] = ia;
                            break Ee;
                        case 0x86:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            Ia = (Ga >> 3) & 7;
                            if ((Ga >> 6) == 3)
                            {
                                Ha = Ga & 7;
                                ia = ((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff);
                                Rb(Ha, ((za[Ia & 3] >> ((Ia & 4) << 1)) & 0xff));
                            } else
                            {
                                ha = Mb(Ga);
                                ia = kb();
                                qb(((za[Ia & 3] >> ((Ia & 4) << 1)) & 0xff));
                            }
                            Rb(Ia, ia);
                            break Ee;
                        case 0x87:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            Ia = (Ga >> 3) & 7;
                            if ((Ga >> 6) == 3)
                            {
                                Ha = Ga & 7;
                                ia = za[Ha];
                                za[Ha] = za[Ia];
                            } else
                            {
                                ha = Mb(Ga);
                                ia = ob();
                                ub(za[Ia]);
                            }
                            za[Ia] = ia;
                            break Ee;
                        case 0x8e:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            Ia = (Ga >> 3) & 7;
                            if (Ia >= 6 || Ia == 1)
                                vc(6);
                            if ((Ga >> 6) == 3)
                            {
                                ia = za[Ga & 7] & 0xffff;
                            } else
                            {
                                ha = Mb(Ga);
                                ia = gb();
                            }
                            ge(Ia, ia);
                            break Ee;
                        case 0x8c:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            Ia = (Ga >> 3) & 7;
                            if (Ia >= 6)
                                vc(6);
                            ia = ya.segs[Ia].selector;
                            if ((Ga >> 6) == 3)
                            {
                                za[Ga & 7] = ia;
                            } else
                            {
                                ha = Mb(Ga);
                                sb(ia);
                            }
                            break Ee;
                        case 0xc4: 
                            {
                                Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                                Hb++;
                                ;
                                if ((Ga >> 3) == 3)
                                    vc(6);
                                ha = Mb(Ga);
                                ia = ib();
                                ha += 4;
                                Ja = gb();
                                ge(0, Ja);
                                za[(Ga >> 3) & 7] = ia;
                            }
                            ;
                            break Ee;
                        case 0xc5: 
                            {
                                Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                                Hb++;
                                ;
                                if ((Ga >> 3) == 3)
                                    vc(6);
                                ha = Mb(Ga);
                                ia = ib();
                                ha += 4;
                                Ja = gb();
                                ge(3, Ja);
                                za[(Ga >> 3) & 7] = ia;
                            }
                            ;
                            break Ee;
                        case 0x00:
                        case 0x08:
                        case 0x10:
                        case 0x18:
                        case 0x20:
                        case 0x28:
                        case 0x30:
                        case 0x38:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            La = b >> 3;
                            Ia = (Ga >> 3) & 7;
                            Ja = ((za[Ia & 3] >> ((Ia & 4) << 1)) & 0xff);
                            if ((Ga >> 6) == 3)
                            {
                                Ha = Ga & 7;
                                Rb(Ha, Tb(La,
									((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff),
									Ja));
                            } else
                            {
                                ha = Mb(Ga);
                                if (La != 7)
                                {
                                    ia = kb();
                                    ia = Tb(La, ia, Ja);
                                    qb(ia);
                                } else
                                {
                                    ia = eb();
                                    Tb(7, ia, Ja);
                                }
                            }
                            break Ee;
                        case 0x01:
                        case 0x09:
                        case 0x11:
                        case 0x19:
                        case 0x21:
                        case 0x29:
                        case 0x31:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            La = b >> 3;
                            Ja = za[(Ga >> 3) & 7];
                            if ((Ga >> 6) == 3)
                            {
                                Ha = Ga & 7;
                                za[Ha] = dc(La, za[Ha], Ja);
                            } else
                            {
                                ha = Mb(Ga);
                                ia = ob();
                                ia = dc(La, ia, Ja);
                                ub(ia);
                            }
                            break Ee;
                        case 0x39:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            La = b >> 3;
                            Ja = za[(Ga >> 3) & 7];
                            if ((Ga >> 6) == 3)
                            {
                                Ha = Ga & 7;
                                {
                                    Aa = Ja;
                                    Ba = (za[Ha] - Aa) & -1;
                                    Ca = 8;
                                }
                                ;
                            } else
                            {
                                ha = Mb(Ga);
                                ia = ib();
                                {
                                    Aa = Ja;
                                    Ba = (ia - Aa) & -1;
                                    Ca = 8;
                                }
                                ;
                            }
                            break Ee;
                        case 0x02:
                        case 0x0a:
                        case 0x12:
                        case 0x1a:
                        case 0x22:
                        case 0x2a:
                        case 0x32:
                        case 0x3a:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            La = b >> 3;
                            Ia = (Ga >> 3) & 7;
                            if ((Ga >> 6) == 3)
                            {
                                Ha = Ga & 7;
                                Ja = ((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff);
                            } else
                            {
                                ha = Mb(Ga);
                                Ja = eb();
                            }
                            Rb(Ia, Tb(La, ((za[Ia & 3] >> ((Ia & 4) << 1)) & 0xff),
								Ja));
                            break Ee;
                        case 0x03:
                        case 0x0b:
                        case 0x13:
                        case 0x1b:
                        case 0x23:
                        case 0x2b:
                        case 0x33:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            La = b >> 3;
                            Ia = (Ga >> 3) & 7;
                            if ((Ga >> 6) == 3)
                            {
                                Ja = za[Ga & 7];
                            } else
                            {
                                ha = Mb(Ga);
                                Ja = ib();
                            }
                            za[Ia] = dc(La, za[Ia], Ja);
                            break Ee;
                        case 0x3b:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            La = b >> 3;
                            Ia = (Ga >> 3) & 7;
                            if ((Ga >> 6) == 3)
                            {
                                Ja = za[Ga & 7];
                            } else
                            {
                                ha = Mb(Ga);
                                Ja = ib();
                            }
                            {
                                Aa = Ja;
                                Ba = (za[Ia] - Aa) & -1;
                                Ca = 8;
                            }
                            ;
                            break Ee;
                        case 0x04:
                        case 0x0c:
                        case 0x14:
                        case 0x1c:
                        case 0x24:
                        case 0x2c:
                        case 0x34:
                        case 0x3c:
                            Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            La = b >> 3;
                            Rb(0, Tb(La, za[0] & 0xff, Ja));
                            break Ee;
                        case 0x05:
                        case 0x0d:
                        case 0x15:
                        case 0x1d:
                        case 0x25:
                        case 0x2d:
                        case 0x35:
                        case 0x3d:
                            Ja = Lb();
                            La = b >> 3;
                            za[0] = dc(La, za[0], Ja);
                            break Ee;
                        case 0x80:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            La = (Ga >> 3) & 7;
                            if ((Ga >> 6) == 3)
                            {
                                Ha = Ga & 7;
                                Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                Hb++;
                                ;
                                Rb(Ha, Tb(La,
									((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff),
									Ja));
                            } else
                            {
                                ha = Mb(Ga);
                                Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                Hb++;
                                ;
                                if (La != 7)
                                {
                                    ia = kb();
                                    ia = Tb(La, ia, Ja);
                                    qb(ia);
                                } else
                                {
                                    ia = eb();
                                    Tb(7, ia, Ja);
                                }
                            }
                            break Ee;
                        case 0x81:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            La = (Ga >> 3) & 7;
                            if ((Ga >> 6) == 3)
                            {
                                Ha = Ga & 7;
                                Ja = Lb();
                                za[Ha] = dc(La, za[Ha], Ja);
                            } else
                            {
                                ha = Mb(Ga);
                                Ja = Lb();
                                if (La != 7)
                                {
                                    ia = ob();
                                    ia = dc(La, ia, Ja);
                                    ub(ia);
                                } else
                                {
                                    ia = ib();
                                    dc(7, ia, Ja);
                                }
                            }
                            break Ee;
                        case 0x83:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            La = (Ga >> 3) & 7;
                            if ((Ga >> 6) == 3)
                            {
                                Ha = Ga & 7;
                                Ja = ((((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
									: Ra[Hb ^ Ua]) << 24) >> 24;
                                Hb++;
                                ;
                                za[Ha] = dc(La, za[Ha], Ja);
                            } else
                            {
                                ha = Mb(Ga);
                                Ja = ((((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
									: Ra[Hb ^ Ua]) << 24) >> 24;
                                Hb++;
                                ;
                                if (La != 7)
                                {
                                    ia = ob();
                                    ia = dc(La, ia, Ja);
                                    ub(ia);
                                } else
                                {
                                    ia = ib();
                                    dc(7, ia, Ja);
                                }
                            }
                            break Ee;
                        case 0x40:
                        case 0x41:
                        case 0x42:
                        case 0x43:
                        case 0x44:
                        case 0x45:
                        case 0x46:
                        case 0x47:
                            Ia = b & 7;
                            {
                                if (Ca < 25)
                                {
                                    Da = Ca;
                                }
                                za[Ia] = Ea = (za[Ia] + 1) & -1;
                                Ca = 27;
                            }
                            ;
                            break Ee;
                        case 0x48:
                        case 0x49:
                        case 0x4a:
                        case 0x4b:
                        case 0x4c:
                        case 0x4d:
                        case 0x4e:
                        case 0x4f:
                            Ia = b & 7;
                            {
                                if (Ca < 25)
                                {
                                    Da = Ca;
                                }
                                za[Ia] = Ea = (za[Ia] - 1) & -1;
                                Ca = 30;
                            }
                            ;
                            break Ee;
                        case 0x6b:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            Ia = (Ga >> 3) & 7;
                            if ((Ga >> 6) == 3)
                            {
                                Ja = za[Ga & 7];
                            } else
                            {
                                ha = Mb(Ga);
                                Ja = ib();
                            }
                            Ka = ((((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
								^ Ua]) << 24) >> 24;
                            Hb++;
                            ;
                            za[Ia] = Oc(Ja, Ka);
                            break Ee;
                        case 0x69:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            Ia = (Ga >> 3) & 7;
                            if ((Ga >> 6) == 3)
                            {
                                Ja = za[Ga & 7];
                            } else
                            {
                                ha = Mb(Ga);
                                Ja = ib();
                            }
                            Ka = Lb();
                            za[Ia] = Oc(Ja, Ka);
                            break Ee;
                        case 0x84:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            if ((Ga >> 6) == 3)
                            {
                                Ha = Ga & 7;
                                ia = ((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff);
                            } else
                            {
                                ha = Mb(Ga);
                                ia = eb();
                            }
                            Ia = (Ga >> 3) & 7;
                            Ja = ((za[Ia & 3] >> ((Ia & 4) << 1)) & 0xff);
                            Ba = ia & Ja;
                            Ca = 12;
                            break Ee;
                        case 0x85:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            if ((Ga >> 6) == 3)
                            {
                                ia = za[Ga & 7];
                            } else
                            {
                                ha = Mb(Ga);
                                ia = ib();
                            }
                            Ja = za[(Ga >> 3) & 7];
                            Ba = ia & Ja;
                            Ca = 14;
                            break Ee;
                        case 0xa8:
                            Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            Ba = za[0] & Ja;
                            Ca = 12;
                            break Ee;
                        case 0xa9:
                            Ja = Lb();
                            Ba = za[0] & Ja;
                            Ca = 14;
                            break Ee;
                        case 0xf6:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            La = (Ga >> 3) & 7;
                            switch (La)
                            {
                                case 0:
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        ia = ((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff);
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = eb();
                                    }
                                    Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ba = ia & Ja;
                                    Ca = 12;
                                    break;
                                case 2:
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        Rb(
										Ha,
										~((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff));
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = kb();
                                        ia = ~ia;
                                        qb(ia);
                                    }
                                    break;
                                case 3:
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        Rb(
										Ha,
										Tb(
												5,
												0,
												((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff)));
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = kb();
                                        ia = Tb(5, 0, ia);
                                        qb(ia);
                                    }
                                    break;
                                case 4:
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        ia = ((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff);
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = eb();
                                    }
                                    Sb(0, Gc(za[0], ia));
                                    break;
                                case 5:
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        ia = ((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff);
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = eb();
                                    }
                                    Sb(0, Hc(za[0], ia));
                                    break;
                                case 6:
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        ia = ((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff);
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = eb();
                                    }
                                    uc(ia);
                                    break;
                                case 7:
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        ia = ((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff);
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = eb();
                                    }
                                    wc(ia);
                                    break;
                                default:
                                    vc(6);
                            }
                            break Ee;
                        case 0xf7:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            La = (Ga >> 3) & 7;
                            switch (La)
                            {
                                case 0:
                                    if ((Ga >> 6) == 3)
                                    {
                                        ia = za[Ga & 7];
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = ib();
                                    }
                                    Ja = Lb();
                                    Ba = ia & Ja;
                                    Ca = 14;
                                    break;
                                case 2:
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        za[Ha] = ~za[Ha];
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = ob();
                                        ia = ~ia;
                                        ub(ia);
                                    }
                                    break;
                                case 3:
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        za[Ha] = dc(5, 0, za[Ha]);
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = ob();
                                        ia = dc(5, 0, ia);
                                        ub(ia);
                                    }
                                    break;
                                case 4:
                                    if ((Ga >> 6) == 3)
                                    {
                                        ia = za[Ga & 7];
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = ib();
                                    }
                                    za[0] = Nc(za[0], ia);
                                    za[2] = Oa;
                                    break;
                                case 5:
                                    if ((Ga >> 6) == 3)
                                    {
                                        ia = za[Ga & 7];
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = ib();
                                    }
                                    za[0] = Oc(za[0], ia);
                                    za[2] = Oa;
                                    break;
                                case 6:
                                    if ((Ga >> 6) == 3)
                                    {
                                        ia = za[Ga & 7];
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = ib();
                                    }
                                    za[0] = zc(za[2], za[0], ia);
                                    za[2] = Oa;
                                    break;
                                case 7:
                                    if ((Ga >> 6) == 3)
                                    {
                                        ia = za[Ga & 7];
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = ib();
                                    }
                                    za[0] = Dc(za[2], za[0], ia);
                                    za[2] = Oa;
                                    break;
                                default:
                                    vc(6);
                            }
                            break Ee;
                        case 0xc0:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            La = (Ga >> 3) & 7;
                            if ((Ga >> 6) == 3)
                            {
                                Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                Hb++;
                                ;
                                Ha = Ga & 7;
                                Rb(Ha, gc(La,
									((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff),
									Ja));
                            } else
                            {
                                ha = Mb(Ga);
                                Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                Hb++;
                                ;
                                ia = kb();
                                ia = gc(La, ia, Ja);
                                qb(ia);
                            }
                            break Ee;
                        case 0xc1:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            La = (Ga >> 3) & 7;
                            if ((Ga >> 6) == 3)
                            {
                                Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                Hb++;
                                ;
                                Ha = Ga & 7;
                                za[Ha] = kc(La, za[Ha], Ja);
                            } else
                            {
                                ha = Mb(Ga);
                                Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                Hb++;
                                ;
                                ia = ob();
                                ia = kc(La, ia, Ja);
                                ub(ia);
                            }
                            break Ee;
                        case 0xd0:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            La = (Ga >> 3) & 7;
                            if ((Ga >> 6) == 3)
                            {
                                Ha = Ga & 7;
                                Rb(
									Ha,
									gc(
											La,
											((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff),
											1));
                            } else
                            {
                                ha = Mb(Ga);
                                ia = kb();
                                ia = gc(La, ia, 1);
                                qb(ia);
                            }
                            break Ee;
                        case 0xd1:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            La = (Ga >> 3) & 7;
                            if ((Ga >> 6) == 3)
                            {
                                Ha = Ga & 7;
                                za[Ha] = kc(La, za[Ha], 1);
                            } else
                            {
                                ha = Mb(Ga);
                                ia = ob();
                                ia = kc(La, ia, 1);
                                ub(ia);
                            }
                            break Ee;
                        case 0xd2:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            La = (Ga >> 3) & 7;
                            Ja = za[1] & 0xff;
                            if ((Ga >> 6) == 3)
                            {
                                Ha = Ga & 7;
                                Rb(Ha, gc(La,
									((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff),
									Ja));
                            } else
                            {
                                ha = Mb(Ga);
                                ia = kb();
                                ia = gc(La, ia, Ja);
                                qb(ia);
                            }
                            break Ee;
                        case 0xd3:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            La = (Ga >> 3) & 7;
                            Ja = za[1] & 0xff;
                            if ((Ga >> 6) == 3)
                            {
                                Ha = Ga & 7;
                                za[Ha] = kc(La, za[Ha], Ja);
                            } else
                            {
                                ha = Mb(Ga);
                                ia = ob();
                                ia = kc(La, ia, Ja);
                                ub(ia);
                            }
                            break Ee;
                        case 0x98:
                            za[0] = (za[0] << 16) >> 16;
                            break Ee;
                        case 0x99:
                            za[2] = za[0] >> 31;
                            break Ee;
                        case 0x50:
                        case 0x51:
                        case 0x52:
                        case 0x53:
                        case 0x54:
                        case 0x55:
                        case 0x56:
                        case 0x57:
                            ia = za[b & 7];
                            ha = (za[4] - 4) & -1;
                            {
                                Ua = ab[ha >>> 12];
                                if ((Ua | ha) & 3)
                                {
                                    tb(ia);
                                } else
                                {
                                    Ta[(ha ^ Ua) >> 2] = ia;
                                }
                            }
                            ;
                            za[4] = ha;
                            break Ee;
                        case 0x58:
                        case 0x59:
                        case 0x5a:
                        case 0x5b:
                        case 0x5c:
                        case 0x5d:
                        case 0x5e:
                        case 0x5f:
                            ha = za[4];
                            ia = (((Ua = Za[ha >>> 12]) | ha) & 3 ? hb()
								: Ta[(ha ^ Ua) >> 2]);
                            za[4] = (ha + 4) & -1;
                            za[b & 7] = ia;
                            break Ee;
                        case 0x60:
                            ha = (za[4] - 32) & -1;
                            Ja = ha;
                            for (Ia = 7; Ia >= 0; Ia--)
                            {
                                ia = za[Ia];
                                {
                                    Ua = ab[ha >>> 12];
                                    if ((Ua | ha) & 3)
                                    {
                                        tb(ia);
                                    } else
                                    {
                                        Ta[(ha ^ Ua) >> 2] = ia;
                                    }
                                }
                                ;
                                ha = (ha + 4) & -1;
                            }
                            za[4] = Ja;
                            break Ee;
                        case 0x61:
                            ha = za[4];
                            for (Ia = 7; Ia >= 0; Ia--)
                            {
                                if (Ia != 4)
                                {
                                    za[Ia] = (((Ua = Za[ha >>> 12]) | ha) & 3 ? hb()
										: Ta[(ha ^ Ua) >> 2]);
                                }
                                ha = (ha + 4) & -1;
                            }
                            za[4] = ha;
                            break Ee;
                        case 0x8f:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            if ((Ga >> 6) == 3)
                            {
                                ha = za[4];
                                ia = ib();
                                za[4] = (ha + 4) & -1;
                                za[Ga & 7] = ia;
                            } else
                            {
                                ha = za[4];
                                ia = ib();
                                ha = Mb(Ga, 4);
                                ub(ia);
                                za[4] = (za[4] + 4) & -1;
                            }
                            break Ee;
                        case 0x68:
                            ia = Lb();
                            ha = (za[4] - 4) & -1;
                            ub(ia);
                            za[4] = ha;
                            break Ee;
                        case 0x6a:
                            ia = ((((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
								^ Ua]) << 24) >> 24;
                            Hb++;
                            ;
                            ha = (za[4] - 4) & -1;
                            ub(ia);
                            za[4] = ha;
                            break Ee;
                        case 0xc9:
                            ha = za[5];
                            ia = ib();
                            za[5] = ia;
                            za[4] = (ha + 4) & -1;
                            break Ee;
                        case 0x9c:
                            ia = Sc();
                            ha = (za[4] - 4) & -1;
                            ub(ia);
                            za[4] = ha;
                            break Ee;
                        case 0x9d:
                            ha = za[4];
                            ia = ib();
                            za[4] = (ha + 4) & -1;
                            if (ya.cpl == 0)
                            {
                                Uc(ia, (0x00000100 | 0x00040000 | 0x00200000
									| 0x00004000 | 0x00000200 | 0x00003000));
                                {
                                    if (ya.hard_irq != 0
										&& (ya.eflags & 0x00000200))
                                        break De;
                                }
                                ;
                            } else
                            {
                                var ye;
                                ye = (ya.eflags >> 12) & 3;
                                if (ya.cpl <= ye)
                                {
                                    Uc(
										ia,
										(0x00000100 | 0x00040000 | 0x00200000 | 0x00004000 | 0x00000200));
                                    {
                                        if (ya.hard_irq != 0
											&& (ya.eflags & 0x00000200))
                                            break De;
                                    }
                                    ;
                                } else
                                {
                                    Uc(
										ia,
										(0x00000100 | 0x00040000 | 0x00200000 | 0x00004000));
                                }
                            }
                            break Ee;
                        case 0x06: 
                            {
                                ia = ya.segs[0].selector;
                                ha = (za[4] - 4) & -1;
                                ub(ia);
                                za[4] = ha;
                            }
                            ;
                            break Ee;
                        case 0x0e: 
                            {
                                ia = ya.segs[1].selector;
                                ha = (za[4] - 4) & -1;
                                ub(ia);
                                za[4] = ha;
                            }
                            ;
                            break Ee;
                        case 0x16: 
                            {
                                ia = ya.segs[2].selector;
                                ha = (za[4] - 4) & -1;
                                ub(ia);
                                za[4] = ha;
                            }
                            ;
                            break Ee;
                        case 0x1e: 
                            {
                                ia = ya.segs[3].selector;
                                ha = (za[4] - 4) & -1;
                                ub(ia);
                                za[4] = ha;
                            }
                            ;
                            break Ee;
                        case 0x07: 
                            {
                                ha = za[4];
                                ia = ib();
                                ge(0, ia & 0xffff);
                                za[4] = (za[4] + 4) & -1;
                            }
                            ;
                            break Ee;
                        case 0x17: 
                            {
                                ha = za[4];
                                ia = ib();
                                ge(2, ia & 0xffff);
                                za[4] = (za[4] + 4) & -1;
                            }
                            ;
                            break Ee;
                        case 0x1f: 
                            {
                                ha = za[4];
                                ia = ib();
                                ge(3, ia & 0xffff);
                                za[4] = (za[4] + 4) & -1;
                            }
                            ;
                            break Ee;
                        case 0x8d:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            if ((Ga >> 6) == 3)
                                vc(6);
                            za[(Ga >> 3) & 7] = Mb(Ga);
                            break Ee;
                        case 0xfe:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            La = (Ga >> 3) & 7;
                            switch (La)
                            {
                                case 0:
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        Rb(
										Ha,
										Yb(((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff)));
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = kb();
                                        ia = Yb(ia);
                                        qb(ia);
                                    }
                                    break;
                                case 1:
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        Rb(
										Ha,
										Zb(((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff)));
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = kb();
                                        ia = Zb(ia);
                                        qb(ia);
                                    }
                                    break;
                                default:
                                    vc(6);
                            }
                            break Ee;
                        case 0xff:
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            La = (Ga >> 3) & 7;
                            switch (La)
                            {
                                case 0:
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        {
                                            if (Ca < 25)
                                            {
                                                Da = Ca;
                                            }
                                            za[Ha] = Ea = (za[Ha] + 1) & -1;
                                            Ca = 27;
                                        }
                                        ;
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = ob();
                                        {
                                            if (Ca < 25)
                                            {
                                                Da = Ca;
                                            }
                                            ia = Ea = (ia + 1) & -1;
                                            Ca = 27;
                                        }
                                        ;
                                        ub(ia);
                                    }
                                    break;
                                case 1:
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        {
                                            if (Ca < 25)
                                            {
                                                Da = Ca;
                                            }
                                            za[Ha] = Ea = (za[Ha] - 1) & -1;
                                            Ca = 30;
                                        }
                                        ;
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = ob();
                                        {
                                            if (Ca < 25)
                                            {
                                                Da = Ca;
                                            }
                                            ia = Ea = (ia - 1) & -1;
                                            Ca = 30;
                                        }
                                        ;
                                        ub(ia);
                                    }
                                    break;
                                case 2:
                                    if ((Ga >> 6) == 3)
                                    {
                                        ia = za[Ga & 7];
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = ib();
                                    }
                                    ha = (za[4] - 4) & -1;
                                    ub(Hb);
                                    za[4] = ha;
                                    Hb = ia;
                                    break;
                                case 4:
                                    if ((Ga >> 6) == 3)
                                    {
                                        ia = za[Ga & 7];
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = ib();
                                    }
                                    Hb = ia;
                                    break;
                                case 6:
                                    if ((Ga >> 6) == 3)
                                    {
                                        ia = za[Ga & 7];
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = ib();
                                    }
                                    ha = (za[4] - 4) & -1;
                                    ub(ia);
                                    za[4] = ha;
                                    break;
                                case 3:
                                case 5:
                                default:
                                    throw "GRP5";
                            }
                            break Ee;
                        case 0xeb:
                            ia = ((((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
								^ Ua]) << 24) >> 24;
                            Hb++;
                            ;
                            Hb = (Hb + ia) >> 0;
                            break Ee;
                        case 0xe9:
                            ia = Lb();
                            Hb = (Hb + ia) >> 0;
                            break Ee;
                        case 0xea:
                            ia = Lb();
                            Ja = Kb();
                            je(Ja, ia);
                            break Ee;
                        case 0x70:
                        case 0x71:
                        case 0x72:
                        case 0x73:
                        case 0x76:
                        case 0x77:
                        case 0x78:
                        case 0x79:
                        case 0x7a:
                        case 0x7b:
                        case 0x7c:
                        case 0x7d:
                        case 0x7e:
                        case 0x7f:
                            if (Xb(b & 0xf))
                            {
                                ia = ((((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
									: Ra[Hb ^ Ua]) << 24) >> 24;
                                Hb++;
                                ;
                                Hb = (Hb + ia) >> 0;
                            } else
                            {
                                Hb = (Hb + 1) >> 0;
                            }
                            break Ee;
                        case 0x74:
                            switch (Ca)
                            {
                                case 0:
                                case 3:
                                case 6:
                                case 9:
                                case 12:
                                case 15:
                                case 18:
                                case 21:
                                    Ja = (Ba & 0xff) == 0;
                                    break;
                                case 1:
                                case 4:
                                case 7:
                                case 10:
                                case 13:
                                case 16:
                                case 19:
                                case 22:
                                    Ja = (Ba & 0xffff) == 0;
                                    break;
                                case 2:
                                case 5:
                                case 8:
                                case 11:
                                case 14:
                                case 17:
                                case 20:
                                case 23:
                                    Ja = Ba == 0;
                                    break;
                                case 24:
                                    Ja = (Aa >> 6) & 1;
                                    break;
                                case 25:
                                case 28:
                                    Ja = (Ea & 0xff) == 0;
                                    break;
                                case 26:
                                case 29:
                                    Ja = (Ea & 0xffff) == 0;
                                    break;
                                case 27:
                                case 30:
                                    Ja = Ea == 0;
                                    break;
                                default:
                                    throw "JZ: unsupported cc_op=" + Ca;
                            }
                            ;
                            if (Ja)
                            {
                                ia = ((((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
									: Ra[Hb ^ Ua]) << 24) >> 24;
                                Hb++;
                                ;
                                Hb = (Hb + ia) >> 0;
                            } else
                            {
                                Hb = (Hb + 1) >> 0;
                            }
                            break Ee;
                        case 0x75:
                            switch (Ca)
                            {
                                case 0:
                                case 3:
                                case 6:
                                case 9:
                                case 12:
                                case 15:
                                case 18:
                                case 21:
                                    Ja = (Ba & 0xff) == 0;
                                    break;
                                case 1:
                                case 4:
                                case 7:
                                case 10:
                                case 13:
                                case 16:
                                case 19:
                                case 22:
                                    Ja = (Ba & 0xffff) == 0;
                                    break;
                                case 2:
                                case 5:
                                case 8:
                                case 11:
                                case 14:
                                case 17:
                                case 20:
                                case 23:
                                    Ja = Ba == 0;
                                    break;
                                case 24:
                                    Ja = (Aa >> 6) & 1;
                                    break;
                                case 25:
                                case 28:
                                    Ja = (Ea & 0xff) == 0;
                                    break;
                                case 26:
                                case 29:
                                    Ja = (Ea & 0xffff) == 0;
                                    break;
                                case 27:
                                case 30:
                                    Ja = Ea == 0;
                                    break;
                                default:
                                    throw "JZ: unsupported cc_op=" + Ca;
                            }
                            ;
                            if (!Ja)
                            {
                                ia = ((((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
									: Ra[Hb ^ Ua]) << 24) >> 24;
                                Hb++;
                                ;
                                Hb = (Hb + ia) >> 0;
                            } else
                            {
                                Hb = (Hb + 1) >> 0;
                            }
                            break Ee;
                        case 0xe2:
                            ia = ((((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
								^ Ua]) << 24) >> 24;
                            Hb++;
                            ;
                            za[1] = (za[1] - 1) & -1;
                            if (za[1])
                                Hb = (Hb + ia) >> 0;
                            break Ee;
                        case 0xe3:
                            ia = ((((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
								^ Ua]) << 24) >> 24;
                            Hb++;
                            ;
                            if (za[1] == 0)
                                Hb = (Hb + ia) >> 0;
                            break Ee;
                        case 0xc2:
                            Ja = (Kb() << 16) >> 16;
                            ha = za[4];
                            ia = ib();
                            za[4] = (za[4] + 4 + Ja) & -1;
                            Hb = ia;
                            break Ee;
                        case 0xc3:
                            ha = za[4];
                            ia = ib();
                            za[4] = (za[4] + 4) & -1;
                            Hb = ia;
                            break Ee;
                        case 0xe8:
                            ia = Lb();
                            ha = (za[4] - 4) & -1;
                            ub(Hb);
                            za[4] = ha;
                            Hb = (Hb + ia) >> 0;
                            break Ee;
                        case 0x90:
                            break Ee;
                        case 0xcc:
                            Ja = Hb;
                            Od(3, 1, 0, Ja, 0);
                            break Ee;
                        case 0xcd:
                            ia = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            Ja = Hb;
                            Od(ia, 1, 0, Ja, 0);
                            break Ee;
                        case 0xce:
                            if (Xb(0))
                            {
                                Ja = Hb;
                                Od(4, 1, 0, Ja, 0);
                            }
                            break Ee;
                        case 0xcf:
                            Be(1);
                            {
                                if (ya.hard_irq != 0 && (ya.eflags & 0x00000200))
                                    break De;
                            }
                            ;
                            break Ee;
                        case 0xf5:
                            Aa = ic() ^ 0x0001;
                            Ca = 24;
                            break Ee;
                        case 0xf8:
                            Aa = ic() & ~0x0001;
                            Ca = 24;
                            break Ee;
                        case 0xf9:
                            Aa = ic() | 0x0001;
                            Ca = 24;
                            break Ee;
                        case 0xfc:
                            ya.df = 1;
                            break Ee;
                        case 0xfd:
                            ya.df = -1;
                            break Ee;
                        case 0xfa:
                            ye = (ya.eflags >> 12) & 3;
                            if (ya.cpl > ye)
                                vc(13);
                            ya.eflags &= ~0x00000200;
                            break Ee;
                        case 0xfb:
                            ye = (ya.eflags >> 12) & 3;
                            if (ya.cpl > ye)
                                vc(13);
                            ya.eflags |= 0x00000200;
                            {
                                if (ya.hard_irq != 0 && (ya.eflags & 0x00000200))
                                    break De;
                            }
                            ;
                            break Ee;
                        case 0x9e:
                            ia = ((za[0] >> 8) & (0x0080 | 0x0040 | 0x0010 | 0x0004 | 0x0001))
								| (Xb(0) << 11);
                            Aa = ia;
                            Ca = 24;
                            break Ee;
                        case 0x9f:
                            ia = Sc();
                            Rb(4, ia);
                            break Ee;
                        case 0xf4:
                            if (ya.cpl != 0)
                                vc(13);
                            ya.halted = 1;
                            Na = 257;
                            break De;
                        case 0xa4:
                            if (Fa & (0x0010 | 0x0020))
                            {
                                if (za[1])
                                {
                                    if (8 === 32 && (za[1] >>> 0) >= 4
										&& ya.df == 1
										&& ((za[6] | za[7]) & 3) == 0 && ed())
                                    {
                                    } else
                                    {
                                        ha = za[6];
                                        ia = eb();
                                        ha = za[7];
                                        qb(ia);
                                        za[6] = (za[6] + (ya.df << 0)) & -1;
                                        za[7] = (za[7] + (ya.df << 0)) & -1;
                                        za[1] = (za[1] - 1) & -1;
                                    }
                                    Hb = Ib;
                                }
                            } else
                            {
                                ha = za[6];
                                ia = eb();
                                ha = za[7];
                                qb(ia);
                                za[6] = (za[6] + (ya.df << 0)) & -1;
                                za[7] = (za[7] + (ya.df << 0)) & -1;
                            }
                            ;
                            break Ee;
                        case 0xa5:
                            if (Fa & (0x0010 | 0x0020))
                            {
                                if (za[1])
                                {
                                    if (32 === 32 && (za[1] >>> 0) >= 4
										&& ya.df == 1
										&& ((za[6] | za[7]) & 3) == 0 && ed())
                                    {
                                    } else
                                    {
                                        ha = za[6];
                                        ia = ib();
                                        ha = za[7];
                                        ub(ia);
                                        za[6] = (za[6] + (ya.df << 2)) & -1;
                                        za[7] = (za[7] + (ya.df << 2)) & -1;
                                        za[1] = (za[1] - 1) & -1;
                                    }
                                    Hb = Ib;
                                }
                            } else
                            {
                                ha = za[6];
                                ia = ib();
                                ha = za[7];
                                ub(ia);
                                za[6] = (za[6] + (ya.df << 2)) & -1;
                                za[7] = (za[7] + (ya.df << 2)) & -1;
                            }
                            ;
                            break Ee;
                        case 0xaa:
                            if (Fa & (0x0010 | 0x0020))
                            {
                                if (za[1])
                                {
                                    if (8 === 32 && (za[1] >>> 0) >= 4
										&& ya.df == 1 && (za[7] & 3) == 0
										&& jd())
                                    {
                                    } else
                                    {
                                        ha = za[7];
                                        qb(za[0]);
                                        za[7] = (ha + (ya.df << 0)) & -1;
                                        za[1] = (za[1] - 1) & -1;
                                    }
                                    Hb = Ib;
                                }
                            } else
                            {
                                ha = za[7];
                                qb(za[0]);
                                za[7] = (ha + (ya.df << 0)) & -1;
                            }
                            ;
                            break Ee;
                        case 0xab:
                            if (Fa & (0x0010 | 0x0020))
                            {
                                if (za[1])
                                {
                                    if (32 === 32 && (za[1] >>> 0) >= 4
										&& ya.df == 1 && (za[7] & 3) == 0
										&& jd())
                                    {
                                    } else
                                    {
                                        ha = za[7];
                                        ub(za[0]);
                                        za[7] = (ha + (ya.df << 2)) & -1;
                                        za[1] = (za[1] - 1) & -1;
                                    }
                                    Hb = Ib;
                                }
                            } else
                            {
                                ha = za[7];
                                ub(za[0]);
                                za[7] = (ha + (ya.df << 2)) & -1;
                            }
                            ;
                            break Ee;
                        case 0xa6:
                            if (Fa & (0x0010 | 0x0020))
                            {
                                if (za[1])
                                {
                                    ha = za[6];
                                    ia = eb();
                                    ha = za[7];
                                    Ja = eb();
                                    Tb(7, ia, Ja);
                                    za[6] = (za[6] + (ya.df << 0)) & -1;
                                    za[7] = (za[7] + (ya.df << 0)) & -1;
                                    za[1] = (za[1] - 1) & -1;
                                    if (Fa & 0x0010)
                                    {
                                        if (!Xb(4))
                                            break Ee;
                                    } else
                                    {
                                        if (Xb(4))
                                            break Ee;
                                    }
                                    Hb = Ib;
                                }
                            } else
                            {
                                ha = za[6];
                                ia = eb();
                                ha = za[7];
                                Ja = eb();
                                Tb(7, ia, Ja);
                                za[6] = (za[6] + (ya.df << 0)) & -1;
                                za[7] = (za[7] + (ya.df << 0)) & -1;
                            }
                            ;
                            break Ee;
                        case 0xa7:
                            if (Fa & (0x0010 | 0x0020))
                            {
                                if (za[1])
                                {
                                    ha = za[6];
                                    ia = ib();
                                    ha = za[7];
                                    Ja = ib();
                                    dc(7, ia, Ja);
                                    za[6] = (za[6] + (ya.df << 2)) & -1;
                                    za[7] = (za[7] + (ya.df << 2)) & -1;
                                    za[1] = (za[1] - 1) & -1;
                                    if (Fa & 0x0010)
                                    {
                                        if (!Xb(4))
                                            break Ee;
                                    } else
                                    {
                                        if (Xb(4))
                                            break Ee;
                                    }
                                    Hb = Ib;
                                }
                            } else
                            {
                                ha = za[6];
                                ia = ib();
                                ha = za[7];
                                Ja = ib();
                                dc(7, ia, Ja);
                                za[6] = (za[6] + (ya.df << 2)) & -1;
                                za[7] = (za[7] + (ya.df << 2)) & -1;
                            }
                            ;
                            break Ee;
                        case 0xac:
                            if (Fa & (0x0010 | 0x0020))
                            {
                                if (za[1])
                                {
                                    ha = za[6];
                                    if (8 == 32)
                                        za[0] = ib();
                                    else
                                        Rb(0, eb());
                                    za[6] = (ha + (ya.df << 0)) & -1;
                                    za[1] = (za[1] - 1) & -1;
                                    Hb = Ib;
                                }
                            } else
                            {
                                ha = za[6];
                                if (8 == 32)
                                    za[0] = ib();
                                else
                                    Rb(0, eb());
                                za[6] = (ha + (ya.df << 0)) & -1;
                            }
                            ;
                            break Ee;
                        case 0xad:
                            if (Fa & (0x0010 | 0x0020))
                            {
                                if (za[1])
                                {
                                    ha = za[6];
                                    if (32 == 32)
                                        za[0] = ib();
                                    else
                                        Fe(0, ib());
                                    za[6] = (ha + (ya.df << 2)) & -1;
                                    za[1] = (za[1] - 1) & -1;
                                    Hb = Ib;
                                }
                            } else
                            {
                                ha = za[6];
                                if (32 == 32)
                                    za[0] = ib();
                                else
                                    Fe(0, ib());
                                za[6] = (ha + (ya.df << 2)) & -1;
                            }
                            ;
                            break Ee;
                        case 0xae:
                            if (Fa & (0x0010 | 0x0020))
                            {
                                if (za[1])
                                {
                                    ha = za[7];
                                    ia = eb();
                                    Tb(7, za[0], ia);
                                    za[7] = (za[7] + (ya.df << 0)) & -1;
                                    za[1] = (za[1] - 1) & -1;
                                    if (Fa & 0x0010)
                                    {
                                        if (!Xb(4))
                                            break Ee;
                                    } else
                                    {
                                        if (Xb(4))
                                            break Ee;
                                    }
                                    Hb = Ib;
                                }
                            } else
                            {
                                ha = za[7];
                                ia = eb();
                                Tb(7, za[0], ia);
                                za[7] = (za[7] + (ya.df << 0)) & -1;
                            }
                            ;
                            break Ee;
                        case 0xaf:
                            if (Fa & (0x0010 | 0x0020))
                            {
                                if (za[1])
                                {
                                    ha = za[7];
                                    ia = ib();
                                    dc(7, za[0], ia);
                                    za[7] = (za[7] + (ya.df << 2)) & -1;
                                    za[1] = (za[1] - 1) & -1;
                                    if (Fa & 0x0010)
                                    {
                                        if (!Xb(4))
                                            break Ee;
                                    } else
                                    {
                                        if (Xb(4))
                                            break Ee;
                                    }
                                    Hb = Ib;
                                }
                            } else
                            {
                                ha = za[7];
                                ia = ib();
                                dc(7, za[0], ia);
                                za[7] = (za[7] + (ya.df << 2)) & -1;
                            }
                            ;
                            break Ee;
                        case 0xd8:
                        case 0xd9:
                        case 0xda:
                        case 0xdb:
                        case 0xdc:
                        case 0xdd:
                        case 0xde:
                        case 0xdf:
                            if (ya.cr0 & ((1 << 2) | (1 << 3)))
                            {
                                vc(7);
                            }
                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            Ia = (Ga >> 3) & 7;
                            Ha = Ga & 7;
                            La = ((b & 7) << 3) | ((Ga >> 3) & 7);
                            Sb(0, 0xffff);
                            if ((Ga >> 6) == 3)
                            {
                            } else
                            {
                                ha = Mb(Ga);
                            }
                            break Ee;
                        case 0x9b:
                            break Ee;
                        case 0xe4:
                            ye = (ya.eflags >> 12) & 3;
                            if (ya.cpl > ye)
                                vc(13);
                            ia = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            Rb(0, ya.ld8_port(ia));
                            {
                                if (ya.hard_irq != 0 && (ya.eflags & 0x00000200))
                                    break De;
                            }
                            ;
                            break Ee;
                        case 0xe5:
                            ye = (ya.eflags >> 12) & 3;
                            if (ya.cpl > ye)
                                vc(13);
                            ia = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            za[0] = ya.ld32_port(ia);
                            {
                                if (ya.hard_irq != 0 && (ya.eflags & 0x00000200))
                                    break De;
                            }
                            ;
                            break Ee;
                        case 0xe6:
                            ye = (ya.eflags >> 12) & 3;
                            if (ya.cpl > ye)
                                vc(13);
                            ia = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            ya.st8_port(ia, za[0] & 0xff);
                            {
                                if (ya.hard_irq != 0 && (ya.eflags & 0x00000200))
                                    break De;
                            }
                            ;
                            break Ee;
                        case 0xe7:
                            ye = (ya.eflags >> 12) & 3;
                            if (ya.cpl > ye)
                                vc(13);
                            ia = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
								: Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            ya.st32_port(ia, za[0]);
                            {
                                if (ya.hard_irq != 0 && (ya.eflags & 0x00000200))
                                    break De;
                            }
                            ;
                            break Ee;
                        case 0xec:
                            ye = (ya.eflags >> 12) & 3;
                            if (ya.cpl > ye)
                                vc(13);
                            Rb(0, ya.ld8_port(za[2] & 0xffff));
                            {
                                if (ya.hard_irq != 0 && (ya.eflags & 0x00000200))
                                    break De;
                            }
                            ;
                            break Ee;
                        case 0xed:
                            ye = (ya.eflags >> 12) & 3;
                            if (ya.cpl > ye)
                                vc(13);
                            za[0] = ya.ld32_port(za[2] & 0xffff);
                            {
                                if (ya.hard_irq != 0 && (ya.eflags & 0x00000200))
                                    break De;
                            }
                            ;
                            break Ee;
                        case 0xee:
                            ye = (ya.eflags >> 12) & 3;
                            if (ya.cpl > ye)
                                vc(13);
                            ya.st8_port(za[2] & 0xffff, za[0] & 0xff);
                            {
                                if (ya.hard_irq != 0 && (ya.eflags & 0x00000200))
                                    break De;
                            }
                            ;
                            break Ee;
                        case 0xef:
                            ye = (ya.eflags >> 12) & 3;
                            if (ya.cpl > ye)
                                vc(13);
                            ya.st32_port(za[2] & 0xffff, za[0]);
                            {
                                if (ya.hard_irq != 0 && (ya.eflags & 0x00000200))
                                    break De;
                            }
                            ;
                            break Ee;
                        case 0x26:
                        case 0x27:
                        case 0x2e:
                        case 0x2f:
                        case 0x36:
                        case 0x37:
                        case 0x3e:
                        case 0x3f:
                        case 0x62:
                        case 0x63:
                        case 0x67:
                        case 0x6c:
                        case 0x6d:
                        case 0x6e:
                        case 0x6f:
                        case 0x82:
                        case 0x9a:
                        case 0xc8:
                        case 0xca:
                        case 0xcb:
                        case 0xd4:
                        case 0xd5:
                        case 0xd6:
                        case 0xd7:
                        case 0xe0:
                        case 0xe1:
                        case 0xf1:
                            vc(6);
                            break;
                        case 0x0f:
                            b = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb ^ Ua];
                            Hb++;
                            ;
                            switch (b)
                            {
                                case 0x80:
                                case 0x81:
                                case 0x82:
                                case 0x83:
                                case 0x84:
                                case 0x85:
                                case 0x86:
                                case 0x87:
                                case 0x88:
                                case 0x89:
                                case 0x8a:
                                case 0x8b:
                                case 0x8c:
                                case 0x8d:
                                case 0x8e:
                                case 0x8f:
                                    Ja = Xb(b & 0xf);
                                    ia = Lb();
                                    if (Ja)
                                        Hb = (Hb + ia) >> 0;
                                    break Ee;
                                case 0x90:
                                case 0x91:
                                case 0x92:
                                case 0x93:
                                case 0x94:
                                case 0x95:
                                case 0x96:
                                case 0x97:
                                case 0x98:
                                case 0x99:
                                case 0x9a:
                                case 0x9b:
                                case 0x9c:
                                case 0x9d:
                                case 0x9e:
                                case 0x9f:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    ia = Xb(b & 0xf);
                                    if ((Ga >> 6) == 3)
                                    {
                                        Rb(Ga & 7, ia);
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        qb(ia);
                                    }
                                    break Ee;
                                case 0x40:
                                case 0x41:
                                case 0x42:
                                case 0x43:
                                case 0x44:
                                case 0x45:
                                case 0x46:
                                case 0x47:
                                case 0x48:
                                case 0x49:
                                case 0x4a:
                                case 0x4b:
                                case 0x4c:
                                case 0x4d:
                                case 0x4e:
                                case 0x4f:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    if ((Ga >> 6) == 3)
                                    {
                                        ia = za[Ga & 7];
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = ib();
                                    }
                                    if (Xb(b & 0xf))
                                        za[(Ga >> 3) & 7] = ia;
                                    break Ee;
                                case 0xb6:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ia = (Ga >> 3) & 7;
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        ia = ((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff);
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = eb();
                                    }
                                    za[Ia] = ia;
                                    break Ee;
                                case 0xb7:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ia = (Ga >> 3) & 7;
                                    if ((Ga >> 6) == 3)
                                    {
                                        ia = za[Ga & 7];
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = gb();
                                    }
                                    za[Ia] = ia & 0xffff;
                                    break Ee;
                                case 0xbe:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ia = (Ga >> 3) & 7;
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        ia = ((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff);
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = eb();
                                    }
                                    za[Ia] = (ia << 24) >> 24;
                                    break Ee;
                                case 0xbf:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ia = (Ga >> 3) & 7;
                                    if ((Ga >> 6) == 3)
                                    {
                                        ia = za[Ga & 7];
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = gb();
                                    }
                                    za[Ia] = (ia << 16) >> 16;
                                    break Ee;
                                case 0x00:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    La = (Ga >> 3) & 7;
                                    switch (La)
                                    {
                                        case 0:
                                        case 1:
                                            if (La == 0)
                                                ia = ya.ldt.selector;
                                            else
                                                ia = ya.tr.selector;
                                            if ((Ga >> 6) == 3)
                                            {
                                                Sb(Ga & 7, ia);
                                            } else
                                            {
                                                ha = Mb(Ga);
                                                sb(ia);
                                            }
                                            break;
                                        case 2:
                                            if (ya.cpl != 0)
                                                vc(13);
                                            if ((Ga >> 6) == 3)
                                            {
                                                ia = za[Ga & 7] & 0xffff;
                                            } else
                                            {
                                                ha = Mb(Ga);
                                                ia = gb();
                                            }
                                            de(ia);
                                            break;
                                        case 3:
                                            if (ya.cpl != 0)
                                                vc(13);
                                            if ((Ga >> 6) == 3)
                                            {
                                                ia = za[Ga & 7] & 0xffff;
                                            } else
                                            {
                                                ha = Mb(Ga);
                                                ia = gb();
                                            }
                                            fe(ia);
                                            break;
                                        default:
                                            vc(6);
                                    }
                                    break Ee;
                                case 0x01:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    La = (Ga >> 3) & 7;
                                    switch (La)
                                    {
                                        case 2:
                                        case 3:
                                            if ((Ga >> 6) == 3)
                                                vc(6);
                                            if (this.cpl != 0)
                                                vc(13);
                                            ha = Mb(Ga);
                                            ia = gb();
                                            ha += 2;
                                            Ja = ib();
                                            if (La == 2)
                                            {
                                                this.gdt.base = Ja;
                                                this.gdt.limit = ia;
                                            } else
                                            {
                                                this.idt.base = Ja;
                                                this.idt.limit = ia;
                                            }
                                            break;
                                        case 7:
                                            if (this.cpl != 0)
                                                vc(13);
                                            if ((Ga >> 6) == 3)
                                                vc(6);
                                            ha = Mb(Ga);
                                            ya.tlb_flush_page(ha & -4096);
                                            break;
                                        default:
                                            vc(6);
                                    }
                                    break Ee;
                                case 0x20:
                                    if (ya.cpl != 0)
                                        vc(13);
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    if ((Ga >> 6) != 3)
                                        vc(6);
                                    Ia = (Ga >> 3) & 7;
                                    switch (Ia)
                                    {
                                        case 0:
                                            ia = ya.cr0;
                                            break;
                                        case 2:
                                            ia = ya.cr2;
                                            break;
                                        case 3:
                                            ia = ya.cr3;
                                            break;
                                        case 4:
                                            ia = ya.cr4;
                                            break;
                                        default:
                                            vc(6);
                                    }
                                    za[Ga & 7] = ia;
                                    break Ee;
                                case 0x22:
                                    if (ya.cpl != 0)
                                        vc(13);
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    if ((Ga >> 6) != 3)
                                        vc(6);
                                    Ia = (Ga >> 3) & 7;
                                    ia = za[Ga & 7];
                                    switch (Ia)
                                    {
                                        case 0:
                                            td(ia);
                                            break;
                                        case 2:
                                            ya.cr2 = ia;
                                            break;
                                        case 3:
                                            vd(ia);
                                            break;
                                        case 4:
                                            xd(ia);
                                            break;
                                        default:
                                            vc(6);
                                    }
                                    break Ee;
                                case 0x06:
                                    if (ya.cpl != 0)
                                        vc(13);
                                    td(ya.cr0 & ~(1 << 3));
                                    break Ee;
                                case 0x23:
                                    if (ya.cpl != 0)
                                        vc(13);
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    if ((Ga >> 6) != 3)
                                        vc(6);
                                    Ia = (Ga >> 3) & 7;
                                    ia = za[Ga & 7];
                                    if (Ia == 4 || Ia == 5)
                                        vc(6);
                                    break Ee;
                                case 0xb2: 
                                    {
                                        Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                        Hb++;
                                        ;
                                        if ((Ga >> 3) == 3)
                                            vc(6);
                                        ha = Mb(Ga);
                                        ia = ib();
                                        ha += 4;
                                        Ja = gb();
                                        ge(2, Ja);
                                        za[(Ga >> 3) & 7] = ia;
                                    }
                                    ;
                                    break Ee;
                                case 0xb4: 
                                    {
                                        Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                        Hb++;
                                        ;
                                        if ((Ga >> 3) == 3)
                                            vc(6);
                                        ha = Mb(Ga);
                                        ia = ib();
                                        ha += 4;
                                        Ja = gb();
                                        ge(4, Ja);
                                        za[(Ga >> 3) & 7] = ia;
                                    }
                                    ;
                                    break Ee;
                                case 0xb5: 
                                    {
                                        Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                        Hb++;
                                        ;
                                        if ((Ga >> 3) == 3)
                                            vc(6);
                                        ha = Mb(Ga);
                                        ia = ib();
                                        ha += 4;
                                        Ja = gb();
                                        ge(5, Ja);
                                        za[(Ga >> 3) & 7] = ia;
                                    }
                                    ;
                                    break Ee;
                                case 0xa2:
                                    Ce();
                                    break Ee;
                                case 0xa4:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ja = za[(Ga >> 3) & 7];
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ka = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
										: Ra[Hb ^ Ua];
                                        Hb++;
                                        ;
                                        Ha = Ga & 7;
                                        za[Ha] = lc(za[Ha], Ja, Ka);
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        Ka = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
										: Ra[Hb ^ Ua];
                                        Hb++;
                                        ;
                                        ia = ob();
                                        ia = lc(La, ia, Ja, Ka);
                                        ub(ia);
                                    }
                                    break Ee;
                                case 0xa5:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ja = za[(Ga >> 3) & 7];
                                    Ka = za[1];
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        za[Ha] = lc(za[Ha], Ja, Ka);
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = ob();
                                        ia = lc(La, ia, Ja, Ka);
                                        ub(ia);
                                    }
                                    break Ee;
                                case 0xac:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ja = za[(Ga >> 3) & 7];
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ka = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
										: Ra[Hb ^ Ua];
                                        Hb++;
                                        ;
                                        Ha = Ga & 7;
                                        za[Ha] = nc(za[Ha], Ja, Ka);
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        Ka = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
										: Ra[Hb ^ Ua];
                                        Hb++;
                                        ;
                                        ia = ob();
                                        ia = nc(La, ia, Ja, Ka);
                                        ub(ia);
                                    }
                                    break Ee;
                                case 0xad:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ja = za[(Ga >> 3) & 7];
                                    Ka = za[1];
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        za[Ha] = nc(za[Ha], Ja, Ka);
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = ob();
                                        ia = nc(La, ia, Ja, Ka);
                                        ub(ia);
                                    }
                                    break Ee;
                                case 0xba:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    La = (Ga >> 3) & 7;
                                    switch (La)
                                    {
                                        case 4:
                                            if ((Ga >> 6) == 3)
                                            {
                                                ia = za[Ga & 7];
                                                Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
											: Ra[Hb ^ Ua];
                                                Hb++;
                                                ;
                                            } else
                                            {
                                                ha = Mb(Ga);
                                                Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
											: Ra[Hb ^ Ua];
                                                Hb++;
                                                ;
                                                ia = ob();
                                            }
                                            oc(ia, Ja);
                                            break;
                                        case 5:
                                            if ((Ga >> 6) == 3)
                                            {
                                                Ha = Ga & 7;
                                                Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
											: Ra[Hb ^ Ua];
                                                Hb++;
                                                ;
                                                za[Ha] = pc(za[Ha], Ja);
                                            } else
                                            {
                                                ha = Mb(Ga);
                                                Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
											: Ra[Hb ^ Ua];
                                                Hb++;
                                                ;
                                                ia = ob();
                                                ia = pc(ia, Ja);
                                                ub(ia);
                                            }
                                            ;
                                            break;
                                        case 6:
                                            if ((Ga >> 6) == 3)
                                            {
                                                Ha = Ga & 7;
                                                Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
											: Ra[Hb ^ Ua];
                                                Hb++;
                                                ;
                                                za[Ha] = qc(za[Ha], Ja);
                                            } else
                                            {
                                                ha = Mb(Ga);
                                                Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
											: Ra[Hb ^ Ua];
                                                Hb++;
                                                ;
                                                ia = ob();
                                                ia = qc(ia, Ja);
                                                ub(ia);
                                            }
                                            ;
                                            break;
                                        case 7:
                                            if ((Ga >> 6) == 3)
                                            {
                                                Ha = Ga & 7;
                                                Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
											: Ra[Hb ^ Ua];
                                                Hb++;
                                                ;
                                                za[Ha] = rc(za[Ha], Ja);
                                            } else
                                            {
                                                ha = Mb(Ga);
                                                Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
											: Ra[Hb ^ Ua];
                                                Hb++;
                                                ;
                                                ia = ob();
                                                ia = rc(ia, Ja);
                                                ub(ia);
                                            }
                                            ;
                                            break;
                                        default:
                                            vc(6);
                                    }
                                    break Ee;
                                case 0xa3:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ja = za[(Ga >> 3) & 7];
                                    if ((Ga >> 6) == 3)
                                    {
                                        ia = za[Ga & 7];
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ha = (ha + ((Ja >> 5) << 2)) & -1;
                                        ia = ib();
                                    }
                                    oc(ia, Ja);
                                    break Ee;
                                case 0xab:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ja = za[(Ga >> 3) & 7];
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        za[Ha] = pc(za[Ha], Ja);
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ha = (ha + ((Ja >> 5) << 2)) & -1;
                                        ia = ob();
                                        ia = pc(ia, Ja);
                                        ub(ia);
                                    }
                                    break Ee;
                                case 0xb3:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ja = za[(Ga >> 3) & 7];
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        za[Ha] = qc(za[Ha], Ja);
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ha = (ha + ((Ja >> 5) << 2)) & -1;
                                        ia = ob();
                                        ia = qc(ia, Ja);
                                        ub(ia);
                                    }
                                    break Ee;
                                case 0xbb:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ja = za[(Ga >> 3) & 7];
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        za[Ha] = rc(za[Ha], Ja);
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ha = (ha + ((Ja >> 5) << 2)) & -1;
                                        ia = ob();
                                        ia = rc(ia, Ja);
                                        ub(ia);
                                    }
                                    break Ee;
                                case 0xbc:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ia = (Ga >> 3) & 7;
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ja = za[Ga & 7];
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        Ja = ib();
                                    }
                                    za[Ia] = sc(za[Ia], Ja);
                                    break Ee;
                                case 0xbd:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ia = (Ga >> 3) & 7;
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ja = za[Ga & 7];
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        Ja = ib();
                                    }
                                    za[Ia] = tc(za[Ia], Ja);
                                    break Ee;
                                case 0xaf:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ia = (Ga >> 3) & 7;
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ja = za[Ga & 7];
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        Ja = ib();
                                    }
                                    za[Ia] = Oc(za[Ia], Ja);
                                    break Ee;
                                case 0x31:
                                    if ((ya.cr4 & (1 << 2)) && ya.cpl != 0)
                                        vc(13);
                                    ia = Wc();
                                    za[0] = ia >>> 0;
                                    za[2] = (ia / 0x100000000) >>> 0;
                                    break Ee;
                                case 0xc0:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ia = (Ga >> 3) & 7;
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        ia = ((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff);
                                        Ja = Tb(
										0,
										ia,
										((za[Ia & 3] >> ((Ia & 4) << 1)) & 0xff));
                                        Rb(Ia, ia);
                                        Rb(Ha, Ja);
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = kb();
                                        Ja = Tb(
										0,
										ia,
										((za[Ia & 3] >> ((Ia & 4) << 1)) & 0xff));
                                        qb(Ja);
                                        Rb(Ia, ia);
                                    }
                                    break Ee;
                                case 0xc1:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ia = (Ga >> 3) & 7;
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        ia = za[Ha];
                                        Ja = dc(0, ia, za[Ia]);
                                        za[Ia] = ia;
                                        za[Ha] = Ja;
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = ob();
                                        Ja = dc(0, ia, za[Ia]);
                                        ub(Ja);
                                        za[Ia] = ia;
                                    }
                                    break Ee;
                                case 0xb1:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ia = (Ga >> 3) & 7;
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        ia = za[Ha];
                                        Ja = dc(5, za[0], ia);
                                        if (Ja == 0)
                                        {
                                            za[Ha] = za[Ia];
                                        } else
                                        {
                                            za[0] = ia;
                                        }
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = ob();
                                        Ja = dc(5, za[0], ia);
                                        if (Ja == 0)
                                        {
                                            ub(za[Ia]);
                                        } else
                                        {
                                            za[0] = ia;
                                        }
                                    }
                                    break Ee;
                                case 0xa0: 
                                    {
                                        ia = ya.segs[4].selector;
                                        ha = (za[4] - 4) & -1;
                                        ub(ia);
                                        za[4] = ha;
                                    }
                                    ;
                                    break Ee;
                                case 0xa8: 
                                    {
                                        ia = ya.segs[5].selector;
                                        ha = (za[4] - 4) & -1;
                                        ub(ia);
                                        za[4] = ha;
                                    }
                                    ;
                                    break Ee;
                                case 0xa1: 
                                    {
                                        ha = za[4];
                                        ia = ib();
                                        ge(4, ia & 0xffff);
                                        za[4] = (za[4] + 4) & -1;
                                    }
                                    ;
                                    break Ee;
                                case 0xa9: 
                                    {
                                        ha = za[4];
                                        ia = ib();
                                        ge(5, ia & 0xffff);
                                        za[4] = (za[4] + 4) & -1;
                                    }
                                    ;
                                    break Ee;
                                case 0xc8:
                                case 0xc9:
                                case 0xca:
                                case 0xcb:
                                case 0xcc:
                                case 0xcd:
                                case 0xce:
                                case 0xcf:
                                    Ia = b & 7;
                                    ia = za[Ia];
                                    ia = (ia >>> 24) | ((ia >> 8) & 0x0000ff00)
									| ((ia << 8) & 0x00ff0000) | (ia << 24);
                                    za[Ia] = ia;
                                    break Ee;
                                case 0x02:
                                case 0x03:
                                case 0x04:
                                case 0x05:
                                case 0x07:
                                case 0x08:
                                case 0x09:
                                case 0x0a:
                                case 0x0b:
                                case 0x0c:
                                case 0x0d:
                                case 0x0e:
                                case 0x0f:
                                case 0x10:
                                case 0x11:
                                case 0x12:
                                case 0x13:
                                case 0x14:
                                case 0x15:
                                case 0x16:
                                case 0x17:
                                case 0x18:
                                case 0x19:
                                case 0x1a:
                                case 0x1b:
                                case 0x1c:
                                case 0x1d:
                                case 0x1e:
                                case 0x1f:
                                case 0x21:
                                case 0x24:
                                case 0x25:
                                case 0x26:
                                case 0x27:
                                case 0x28:
                                case 0x29:
                                case 0x2a:
                                case 0x2b:
                                case 0x2c:
                                case 0x2d:
                                case 0x2e:
                                case 0x2f:
                                case 0x30:
                                case 0x32:
                                case 0x33:
                                case 0x34:
                                case 0x35:
                                case 0x36:
                                case 0x37:
                                case 0x38:
                                case 0x39:
                                case 0x3a:
                                case 0x3b:
                                case 0x3c:
                                case 0x3d:
                                case 0x3e:
                                case 0x3f:
                                case 0x50:
                                case 0x51:
                                case 0x52:
                                case 0x53:
                                case 0x54:
                                case 0x55:
                                case 0x56:
                                case 0x57:
                                case 0x58:
                                case 0x59:
                                case 0x5a:
                                case 0x5b:
                                case 0x5c:
                                case 0x5d:
                                case 0x5e:
                                case 0x5f:
                                case 0x60:
                                case 0x61:
                                case 0x62:
                                case 0x63:
                                case 0x64:
                                case 0x65:
                                case 0x66:
                                case 0x67:
                                case 0x68:
                                case 0x69:
                                case 0x6a:
                                case 0x6b:
                                case 0x6c:
                                case 0x6d:
                                case 0x6e:
                                case 0x6f:
                                case 0x70:
                                case 0x71:
                                case 0x72:
                                case 0x73:
                                case 0x74:
                                case 0x75:
                                case 0x76:
                                case 0x77:
                                case 0x78:
                                case 0x79:
                                case 0x7a:
                                case 0x7b:
                                case 0x7c:
                                case 0x7d:
                                case 0x7e:
                                case 0x7f:
                                case 0xa6:
                                case 0xa7:
                                case 0xaa:
                                case 0xae:
                                case 0xb0:
                                case 0xb8:
                                case 0xb9:
                                case 0xc2:
                                case 0xc3:
                                case 0xc4:
                                case 0xc5:
                                case 0xc6:
                                case 0xc7:
                                case 0xd0:
                                case 0xd1:
                                case 0xd2:
                                case 0xd3:
                                case 0xd4:
                                case 0xd5:
                                case 0xd6:
                                case 0xd7:
                                case 0xd8:
                                case 0xd9:
                                case 0xda:
                                case 0xdb:
                                case 0xdc:
                                case 0xdd:
                                case 0xde:
                                case 0xdf:
                                case 0xe0:
                                case 0xe1:
                                case 0xe2:
                                case 0xe3:
                                case 0xe4:
                                case 0xe5:
                                case 0xe6:
                                case 0xe7:
                                case 0xe8:
                                case 0xe9:
                                case 0xea:
                                case 0xeb:
                                case 0xec:
                                case 0xed:
                                case 0xee:
                                case 0xef:
                                case 0xf0:
                                case 0xf1:
                                case 0xf2:
                                case 0xf3:
                                case 0xf4:
                                case 0xf5:
                                case 0xf6:
                                case 0xf7:
                                case 0xf8:
                                case 0xf9:
                                case 0xfa:
                                case 0xfb:
                                case 0xfc:
                                case 0xfd:
                                case 0xfe:
                                case 0xff:
                                default:
                                    vc(6);
                            }
                            break;
                        default:
                            switch (b)
                            {
                                case 0x166:
                                    Fa |= 0x0100;
                                    b = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    b |= (Fa & 0x0100);
                                    break;
                                case 0x1f0:
                                    Fa |= 0x0040;
                                    b = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    b |= (Fa & 0x0100);
                                    break;
                                case 0x1f2:
                                    Fa |= 0x0020;
                                    b = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    b |= (Fa & 0x0100);
                                    break;
                                case 0x1f3:
                                    Fa |= 0x0010;
                                    b = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    b |= (Fa & 0x0100);
                                    break;
                                case 0x164:
                                    Fa = (Fa & ~0x000f) | (4 + 1);
                                    b = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    b |= (Fa & 0x0100);
                                    ;
                                    break;
                                case 0x165:
                                    Fa = (Fa & ~0x000f) | (5 + 1);
                                    b = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    b |= (Fa & 0x0100);
                                    ;
                                    break;
                                case 0x189:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    ia = za[(Ga >> 3) & 7];
                                    if ((Ga >> 6) == 3)
                                    {
                                        Sb(Ga & 7, ia);
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        sb(ia);
                                    }
                                    break Ee;
                                case 0x18b:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    if ((Ga >> 6) == 3)
                                    {
                                        ia = za[Ga & 7];
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = gb();
                                    }
                                    Sb((Ga >> 3) & 7, ia);
                                    break Ee;
                                case 0x1b8:
                                case 0x1b9:
                                case 0x1ba:
                                case 0x1bb:
                                case 0x1bc:
                                case 0x1bd:
                                case 0x1be:
                                case 0x1bf:
                                    Sb(b & 7, Kb());
                                    break Ee;
                                case 0x1a1:
                                    ha = Qb();
                                    ia = gb();
                                    Sb(0, ia);
                                    break Ee;
                                case 0x1a3:
                                    ha = Qb();
                                    sb(za[0]);
                                    break Ee;
                                case 0x1c7:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    if ((Ga >> 6) == 3)
                                    {
                                        ia = Kb();
                                        Sb(Ga & 7, ia);
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = Kb();
                                        sb(ia);
                                    }
                                    break Ee;
                                case 0x191:
                                case 0x192:
                                case 0x193:
                                case 0x194:
                                case 0x195:
                                case 0x196:
                                case 0x197:
                                    Ia = b & 7;
                                    ia = za[0];
                                    Sb(0, za[Ia]);
                                    Sb(Ia, ia);
                                    break Ee;
                                case 0x187:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ia = (Ga >> 3) & 7;
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        ia = za[Ha];
                                        Sb(Ha, za[Ia]);
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = mb();
                                        sb(za[Ia]);
                                    }
                                    Sb(Ia, ia);
                                    break Ee;
                                case 0x101:
                                case 0x109:
                                case 0x111:
                                case 0x119:
                                case 0x121:
                                case 0x129:
                                case 0x131:
                                case 0x139:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    La = (b >> 3) & 7;
                                    Ja = za[(Ga >> 3) & 7];
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        Sb(Ha, ac(La, za[Ha], Ja));
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        if (La != 7)
                                        {
                                            ia = mb();
                                            ia = ac(La, ia, Ja);
                                            sb(ia);
                                        } else
                                        {
                                            ia = gb();
                                            ac(7, ia, Ja);
                                        }
                                    }
                                    break Ee;
                                case 0x103:
                                case 0x10b:
                                case 0x113:
                                case 0x11b:
                                case 0x123:
                                case 0x12b:
                                case 0x133:
                                case 0x13b:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    La = (b >> 3) & 7;
                                    Ia = (Ga >> 3) & 7;
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ja = za[Ga & 7];
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        Ja = gb();
                                    }
                                    Sb(Ia, ac(La, za[Ia], Ja));
                                    break Ee;
                                case 0x105:
                                case 0x10d:
                                case 0x115:
                                case 0x11d:
                                case 0x125:
                                case 0x12d:
                                case 0x135:
                                case 0x13d:
                                    Ja = Kb();
                                    La = (b >> 3) & 7;
                                    Sb(0, ac(La, za[0], Ja));
                                    break Ee;
                                case 0x181:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    La = (Ga >> 3) & 7;
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        Ja = Kb();
                                        za[Ha] = ac(La, za[Ha], Ja);
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        Ja = Kb();
                                        if (La != 7)
                                        {
                                            ia = mb();
                                            ia = ac(La, ia, Ja);
                                            sb(ia);
                                        } else
                                        {
                                            ia = gb();
                                            ac(7, ia, Ja);
                                        }
                                    }
                                    break Ee;
                                case 0x183:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    La = (Ga >> 3) & 7;
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        Ja = ((((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
										: Ra[Hb ^ Ua]) << 24) >> 24;
                                        Hb++;
                                        ;
                                        Sb(Ha, ac(La, za[Ha], Ja));
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        Ja = ((((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
										: Ra[Hb ^ Ua]) << 24) >> 24;
                                        Hb++;
                                        ;
                                        if (La != 7)
                                        {
                                            ia = mb();
                                            ia = ac(La, ia, Ja);
                                            sb(ia);
                                        } else
                                        {
                                            ia = gb();
                                            ac(7, ia, Ja);
                                        }
                                    }
                                    break Ee;
                                case 0x140:
                                case 0x141:
                                case 0x142:
                                case 0x143:
                                case 0x144:
                                case 0x145:
                                case 0x146:
                                case 0x147:
                                    Ia = b & 7;
                                    Sb(Ia, bc(za[Ia]));
                                    break Ee;
                                case 0x148:
                                case 0x149:
                                case 0x14a:
                                case 0x14b:
                                case 0x14c:
                                case 0x14d:
                                case 0x14e:
                                case 0x14f:
                                    Ia = b & 7;
                                    Sb(Ia, cc(za[Ia]));
                                    break Ee;
                                case 0x16b:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ia = (Ga >> 3) & 7;
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ja = za[Ga & 7];
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        Ja = gb();
                                    }
                                    Ka = ((((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
									: Ra[Hb ^ Ua]) << 24) >> 24;
                                    Hb++;
                                    ;
                                    Sb(Ia, Jc(Ja, Ka));
                                    break Ee;
                                case 0x169:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Ia = (Ga >> 3) & 7;
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ja = za[Ga & 7];
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        Ja = gb();
                                    }
                                    Ka = Kb();
                                    Sb(Ia, Jc(Ja, Ka));
                                    break Ee;
                                case 0x185:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    if ((Ga >> 6) == 3)
                                    {
                                        ia = za[Ga & 7];
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = gb();
                                    }
                                    Ja = za[(Ga >> 3) & 7];
                                    Ba = ia & Ja;
                                    Ca = 13;
                                    break Ee;
                                case 0x1a9:
                                    Ja = Kb();
                                    Ba = za[0] & Ja;
                                    Ca = 13;
                                    break Ee;
                                case 0x1f7:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    La = (Ga >> 3) & 7;
                                    switch (La)
                                    {
                                        case 0:
                                            if ((Ga >> 6) == 3)
                                            {
                                                ia = za[Ga & 7];
                                            } else
                                            {
                                                ha = Mb(Ga);
                                                ia = gb();
                                            }
                                            Ja = Kb();
                                            Ba = ia & Ja;
                                            Ca = 13;
                                            break;
                                        case 2:
                                            if ((Ga >> 6) == 3)
                                            {
                                                Ha = Ga & 7;
                                                Sb(Ha, ~za[Ha]);
                                            } else
                                            {
                                                ha = Mb(Ga);
                                                ia = mb();
                                                ia = ~ia;
                                                sb(ia);
                                            }
                                            break;
                                        case 3:
                                            if ((Ga >> 6) == 3)
                                            {
                                                Ha = Ga & 7;
                                                Sb(Ha, ac(5, 0, za[Ha]));
                                            } else
                                            {
                                                ha = Mb(Ga);
                                                ia = mb();
                                                ia = ac(5, 0, ia);
                                                sb(ia);
                                            }
                                            break;
                                        case 4:
                                            if ((Ga >> 6) == 3)
                                            {
                                                ia = za[Ga & 7];
                                            } else
                                            {
                                                ha = Mb(Ga);
                                                ia = gb();
                                            }
                                            ia = Ic(za[0], ia);
                                            Sb(0, ia);
                                            Sb(2, ia >> 16);
                                            break;
                                        case 5:
                                            if ((Ga >> 6) == 3)
                                            {
                                                ia = za[Ga & 7];
                                            } else
                                            {
                                                ha = Mb(Ga);
                                                ia = gb();
                                            }
                                            ia = Jc(za[0], ia);
                                            Sb(0, ia);
                                            Sb(2, ia >> 16);
                                            break;
                                        case 6:
                                            if ((Ga >> 6) == 3)
                                            {
                                                ia = za[Ga & 7];
                                            } else
                                            {
                                                ha = Mb(Ga);
                                                ia = gb();
                                            }
                                            xc(ia);
                                            break;
                                        case 7:
                                            if ((Ga >> 6) == 3)
                                            {
                                                ia = za[Ga & 7];
                                            } else
                                            {
                                                ha = Mb(Ga);
                                                ia = gb();
                                            }
                                            yc(ia);
                                            break;
                                        default:
                                            vc(6);
                                    }
                                    break Ee;
                                case 0x1c1:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    La = (Ga >> 3) & 7;
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
										: Ra[Hb ^ Ua];
                                        Hb++;
                                        ;
                                        Ha = Ga & 7;
                                        Sb(Ha, jc(La, za[Ha], Ja));
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        Ja = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
										: Ra[Hb ^ Ua];
                                        Hb++;
                                        ;
                                        ia = mb();
                                        ia = jc(La, ia, Ja);
                                        sb(ia);
                                    }
                                    break Ee;
                                case 0x1d1:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    La = (Ga >> 3) & 7;
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        Sb(Ha, jc(La, za[Ha], 1));
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = mb();
                                        ia = jc(La, ia, 1);
                                        sb(ia);
                                    }
                                    break Ee;
                                case 0x1d3:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    La = (Ga >> 3) & 7;
                                    Ja = za[1] & 0xff;
                                    if ((Ga >> 6) == 3)
                                    {
                                        Ha = Ga & 7;
                                        Sb(Ha, jc(La, za[Ha], Ja));
                                    } else
                                    {
                                        ha = Mb(Ga);
                                        ia = mb();
                                        ia = jc(La, ia, Ja);
                                        sb(ia);
                                    }
                                    break Ee;
                                case 0x198:
                                    Sb(0, (za[0] << 24) >> 24);
                                    break Ee;
                                case 0x199:
                                    Sb(2, (za[0] << 16) >> 31);
                                    break Ee;
                                case 0x1ff:
                                    Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    La = (Ga >> 3) & 7;
                                    switch (La)
                                    {
                                        case 0:
                                            if ((Ga >> 6) == 3)
                                            {
                                                Ha = Ga & 7;
                                                Sb(Ha, bc(za[Ha]));
                                            } else
                                            {
                                                ha = Mb(Ga);
                                                ia = mb();
                                                ia = bc(ia);
                                                sb(ia);
                                            }
                                            break;
                                        case 1:
                                            if ((Ga >> 6) == 3)
                                            {
                                                Ha = Ga & 7;
                                                Sb(Ha, cc(za[Ha]));
                                            } else
                                            {
                                                ha = Mb(Ga);
                                                ia = mb();
                                                ia = cc(ia);
                                                sb(ia);
                                            }
                                            break;
                                        case 2:
                                        case 4:
                                        case 6:
                                        case 3:
                                        case 5:
                                        default:
                                            throw "GRP5";
                                    }
                                    break Ee;
                                case 0x190:
                                    break Ee;
                                case 0x1a5:
                                    if (Fa & (0x0010 | 0x0020))
                                    {
                                        if (za[1])
                                        {
                                            if (16 === 32 && (za[1] >>> 0) >= 4
											&& ya.df == 1
											&& ((za[6] | za[7]) & 3) == 0
											&& ed())
                                            {
                                            } else
                                            {
                                                ha = za[6];
                                                ia = gb();
                                                ha = za[7];
                                                sb(ia);
                                                za[6] = (za[6] + (ya.df << 1)) & -1;
                                                za[7] = (za[7] + (ya.df << 1)) & -1;
                                                za[1] = (za[1] - 1) & -1;
                                            }
                                            Hb = Ib;
                                        }
                                    } else
                                    {
                                        ha = za[6];
                                        ia = gb();
                                        ha = za[7];
                                        sb(ia);
                                        za[6] = (za[6] + (ya.df << 1)) & -1;
                                        za[7] = (za[7] + (ya.df << 1)) & -1;
                                    }
                                    ;
                                    break Ee;
                                case 0x1a7:
                                    if (Fa & (0x0010 | 0x0020))
                                    {
                                        if (za[1])
                                        {
                                            ha = za[6];
                                            ia = gb();
                                            ha = za[7];
                                            Ja = gb();
                                            ac(7, ia, Ja);
                                            za[6] = (za[6] + (ya.df << 1)) & -1;
                                            za[7] = (za[7] + (ya.df << 1)) & -1;
                                            za[1] = (za[1] - 1) & -1;
                                            if (Fa & 0x0010)
                                            {
                                                if (!Xb(4))
                                                    break Ee;
                                            } else
                                            {
                                                if (Xb(4))
                                                    break Ee;
                                            }
                                            Hb = Ib;
                                        }
                                    } else
                                    {
                                        ha = za[6];
                                        ia = gb();
                                        ha = za[7];
                                        Ja = gb();
                                        ac(7, ia, Ja);
                                        za[6] = (za[6] + (ya.df << 1)) & -1;
                                        za[7] = (za[7] + (ya.df << 1)) & -1;
                                    }
                                    ;
                                    break Ee;
                                case 0x1ad:
                                    if (Fa & (0x0010 | 0x0020))
                                    {
                                        if (za[1])
                                        {
                                            ha = za[6];
                                            if (16 == 32)
                                                za[0] = ib();
                                            else
                                                Sb(0, gb());
                                            za[6] = (ha + (ya.df << 1)) & -1;
                                            za[1] = (za[1] - 1) & -1;
                                            Hb = Ib;
                                        }
                                    } else
                                    {
                                        ha = za[6];
                                        if (16 == 32)
                                            za[0] = ib();
                                        else
                                            Sb(0, gb());
                                        za[6] = (ha + (ya.df << 1)) & -1;
                                    }
                                    ;
                                    break Ee;
                                case 0x1af:
                                    if (Fa & (0x0010 | 0x0020))
                                    {
                                        if (za[1])
                                        {
                                            ha = za[7];
                                            ia = gb();
                                            ac(7, za[0], ia);
                                            za[7] = (za[7] + (ya.df << 1)) & -1;
                                            za[1] = (za[1] - 1) & -1;
                                            if (Fa & 0x0010)
                                            {
                                                if (!Xb(4))
                                                    break Ee;
                                            } else
                                            {
                                                if (Xb(4))
                                                    break Ee;
                                            }
                                            Hb = Ib;
                                        }
                                    } else
                                    {
                                        ha = za[7];
                                        ia = gb();
                                        ac(7, za[0], ia);
                                        za[7] = (za[7] + (ya.df << 1)) & -1;
                                    }
                                    ;
                                    break Ee;
                                case 0x1ab:
                                    if (Fa & (0x0010 | 0x0020))
                                    {
                                        if (za[1])
                                        {
                                            if (16 === 32 && (za[1] >>> 0) >= 4
											&& ya.df == 1 && (za[7] & 3) == 0
											&& jd())
                                            {
                                            } else
                                            {
                                                ha = za[7];
                                                sb(za[0]);
                                                za[7] = (ha + (ya.df << 1)) & -1;
                                                za[1] = (za[1] - 1) & -1;
                                            }
                                            Hb = Ib;
                                        }
                                    } else
                                    {
                                        ha = za[7];
                                        sb(za[0]);
                                        za[7] = (ha + (ya.df << 1)) & -1;
                                    }
                                    ;
                                    break Ee;
                                case 0x1d8:
                                case 0x1d9:
                                case 0x1da:
                                case 0x1db:
                                case 0x1dc:
                                case 0x1dd:
                                case 0x1de:
                                case 0x1df:
                                    b &= 0xff;
                                    break;
                                case 0x1e5:
                                    ye = (ya.eflags >> 12) & 3;
                                    if (ya.cpl > ye)
                                        vc(13);
                                    ia = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    Sb(0, ya.ld16_port(ia));
                                    {
                                        if (ya.hard_irq != 0
										&& (ya.eflags & 0x00000200))
                                            break De;
                                    }
                                    ;
                                    break Ee;
                                case 0x1e7:
                                    ye = (ya.eflags >> 12) & 3;
                                    if (ya.cpl > ye)
                                        vc(13);
                                    ia = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    ya.st16_port(ia, za[0] & 0xffff);
                                    {
                                        if (ya.hard_irq != 0
										&& (ya.eflags & 0x00000200))
                                            break De;
                                    }
                                    ;
                                    break Ee;
                                case 0x1ed:
                                    ye = (ya.eflags >> 12) & 3;
                                    if (ya.cpl > ye)
                                        vc(13);
                                    Sb(0, ya.ld16_port(za[2] & 0xffff));
                                    {
                                        if (ya.hard_irq != 0
										&& (ya.eflags & 0x00000200))
                                            break De;
                                    }
                                    ;
                                    break Ee;
                                case 0x1ef:
                                    ye = (ya.eflags >> 12) & 3;
                                    if (ya.cpl > ye)
                                        vc(13);
                                    ya.st16_port(za[2] & 0xffff, za[0] & 0xffff);
                                    {
                                        if (ya.hard_irq != 0
										&& (ya.eflags & 0x00000200))
                                            break De;
                                    }
                                    ;
                                    break Ee;
                                case 0x100:
                                case 0x102:
                                case 0x104:
                                case 0x106:
                                case 0x107:
                                case 0x108:
                                case 0x10a:
                                case 0x10c:
                                case 0x10e:
                                case 0x110:
                                case 0x112:
                                case 0x114:
                                case 0x116:
                                case 0x117:
                                case 0x118:
                                case 0x11a:
                                case 0x11c:
                                case 0x11e:
                                case 0x11f:
                                case 0x120:
                                case 0x122:
                                case 0x124:
                                case 0x126:
                                case 0x127:
                                case 0x128:
                                case 0x12a:
                                case 0x12c:
                                case 0x12e:
                                case 0x12f:
                                case 0x130:
                                case 0x132:
                                case 0x134:
                                case 0x136:
                                case 0x137:
                                case 0x138:
                                case 0x13a:
                                case 0x13c:
                                case 0x13e:
                                case 0x13f:
                                case 0x150:
                                case 0x151:
                                case 0x152:
                                case 0x153:
                                case 0x154:
                                case 0x155:
                                case 0x156:
                                case 0x157:
                                case 0x158:
                                case 0x159:
                                case 0x15a:
                                case 0x15b:
                                case 0x15c:
                                case 0x15d:
                                case 0x15e:
                                case 0x15f:
                                case 0x160:
                                case 0x161:
                                case 0x162:
                                case 0x163:
                                case 0x167:
                                case 0x168:
                                case 0x16a:
                                case 0x16c:
                                case 0x16d:
                                case 0x16e:
                                case 0x16f:
                                case 0x170:
                                case 0x171:
                                case 0x172:
                                case 0x173:
                                case 0x174:
                                case 0x175:
                                case 0x176:
                                case 0x177:
                                case 0x178:
                                case 0x179:
                                case 0x17a:
                                case 0x17b:
                                case 0x17c:
                                case 0x17d:
                                case 0x17e:
                                case 0x17f:
                                case 0x180:
                                case 0x182:
                                case 0x184:
                                case 0x186:
                                case 0x188:
                                case 0x18a:
                                case 0x18c:
                                case 0x18d:
                                case 0x18e:
                                case 0x18f:
                                case 0x19a:
                                case 0x19b:
                                case 0x19c:
                                case 0x19d:
                                case 0x19e:
                                case 0x19f:
                                case 0x1a0:
                                case 0x1a2:
                                case 0x1a4:
                                case 0x1a6:
                                case 0x1a8:
                                case 0x1aa:
                                case 0x1ac:
                                case 0x1ae:
                                case 0x1b0:
                                case 0x1b1:
                                case 0x1b2:
                                case 0x1b3:
                                case 0x1b4:
                                case 0x1b5:
                                case 0x1b6:
                                case 0x1b7:
                                case 0x1c0:
                                case 0x1c2:
                                case 0x1c3:
                                case 0x1c4:
                                case 0x1c5:
                                case 0x1c6:
                                case 0x1c8:
                                case 0x1c9:
                                case 0x1ca:
                                case 0x1cb:
                                case 0x1cc:
                                case 0x1cd:
                                case 0x1ce:
                                case 0x1cf:
                                case 0x1d0:
                                case 0x1d2:
                                case 0x1d4:
                                case 0x1d5:
                                case 0x1d6:
                                case 0x1d7:
                                case 0x1e0:
                                case 0x1e1:
                                case 0x1e2:
                                case 0x1e3:
                                case 0x1e4:
                                case 0x1e6:
                                case 0x1e8:
                                case 0x1e9:
                                case 0x1ea:
                                case 0x1eb:
                                case 0x1ec:
                                case 0x1ee:
                                case 0x1f1:
                                case 0x1f4:
                                case 0x1f5:
                                case 0x1f6:
                                case 0x1f8:
                                case 0x1f9:
                                case 0x1fa:
                                case 0x1fb:
                                case 0x1fc:
                                case 0x1fd:
                                case 0x1fe:
                                default:
                                    vc(6);
                                case 0x10f:
                                    b = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb) : Ra[Hb
									^ Ua];
                                    Hb++;
                                    ;
                                    b |= 0x0100;
                                    switch (b)
                                    {
                                        case 0x140:
                                        case 0x141:
                                        case 0x142:
                                        case 0x143:
                                        case 0x144:
                                        case 0x145:
                                        case 0x146:
                                        case 0x147:
                                        case 0x148:
                                        case 0x149:
                                        case 0x14a:
                                        case 0x14b:
                                        case 0x14c:
                                        case 0x14d:
                                        case 0x14e:
                                        case 0x14f:
                                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
										: Ra[Hb ^ Ua];
                                            Hb++;
                                            ;
                                            if ((Ga >> 6) == 3)
                                            {
                                                ia = za[Ga & 7];
                                            } else
                                            {
                                                ha = Mb(Ga);
                                                ia = gb();
                                            }
                                            if (Xb(b & 0xf))
                                                Sb((Ga >> 3) & 7, ia);
                                            break Ee;
                                        case 0x1b6:
                                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
										: Ra[Hb ^ Ua];
                                            Hb++;
                                            ;
                                            Ia = (Ga >> 3) & 7;
                                            if ((Ga >> 6) == 3)
                                            {
                                                Ha = Ga & 7;
                                                ia = ((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff);
                                            } else
                                            {
                                                ha = Mb(Ga);
                                                ia = eb();
                                            }
                                            Sb(Ia, ia);
                                            break Ee;
                                        case 0x1be:
                                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
										: Ra[Hb ^ Ua];
                                            Hb++;
                                            ;
                                            Ia = (Ga >> 3) & 7;
                                            if ((Ga >> 6) == 3)
                                            {
                                                Ha = Ga & 7;
                                                ia = ((za[Ha & 3] >> ((Ha & 4) << 1)) & 0xff);
                                            } else
                                            {
                                                ha = Mb(Ga);
                                                ia = eb();
                                            }
                                            Sb(Ia, (ia << 24) >> 24);
                                            break Ee;
                                        case 0x1af:
                                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
										: Ra[Hb ^ Ua];
                                            Hb++;
                                            ;
                                            Ia = (Ga >> 3) & 7;
                                            if ((Ga >> 6) == 3)
                                            {
                                                Ja = za[Ga & 7];
                                            } else
                                            {
                                                ha = Mb(Ga);
                                                Ja = gb();
                                            }
                                            Sb(Ia, Jc(za[Ia], Ja));
                                            break Ee;
                                        case 0x1c1:
                                            Ga = ((Ua = Za[Hb >>> 12]) == -1) ? Jb(Hb)
										: Ra[Hb ^ Ua];
                                            Hb++;
                                            ;
                                            Ia = (Ga >> 3) & 7;
                                            if ((Ga >> 6) == 3)
                                            {
                                                Ha = Ga & 7;
                                                ia = za[Ha];
                                                Ja = ac(0, ia, za[Ia]);
                                                Sb(Ia, ia);
                                                Sb(Ha, Ja);
                                            } else
                                            {
                                                ha = Mb(Ga);
                                                ia = mb();
                                                Ja = ac(0, ia, za[Ia]);
                                                sb(Ja);
                                                Sb(Ia, ia);
                                            }
                                            break Ee;
                                        case 0x100:
                                        case 0x101:
                                        case 0x102:
                                        case 0x103:
                                        case 0x104:
                                        case 0x105:
                                        case 0x106:
                                        case 0x107:
                                        case 0x108:
                                        case 0x109:
                                        case 0x10a:
                                        case 0x10b:
                                        case 0x10c:
                                        case 0x10d:
                                        case 0x10e:
                                        case 0x10f:
                                        case 0x110:
                                        case 0x111:
                                        case 0x112:
                                        case 0x113:
                                        case 0x114:
                                        case 0x115:
                                        case 0x116:
                                        case 0x117:
                                        case 0x118:
                                        case 0x119:
                                        case 0x11a:
                                        case 0x11b:
                                        case 0x11c:
                                        case 0x11d:
                                        case 0x11e:
                                        case 0x11f:
                                        case 0x120:
                                        case 0x121:
                                        case 0x122:
                                        case 0x123:
                                        case 0x124:
                                        case 0x125:
                                        case 0x126:
                                        case 0x127:
                                        case 0x128:
                                        case 0x129:
                                        case 0x12a:
                                        case 0x12b:
                                        case 0x12c:
                                        case 0x12d:
                                        case 0x12e:
                                        case 0x12f:
                                        case 0x130:
                                        case 0x131:
                                        case 0x132:
                                        case 0x133:
                                        case 0x134:
                                        case 0x135:
                                        case 0x136:
                                        case 0x137:
                                        case 0x138:
                                        case 0x139:
                                        case 0x13a:
                                        case 0x13b:
                                        case 0x13c:
                                        case 0x13d:
                                        case 0x13e:
                                        case 0x13f:
                                        case 0x150:
                                        case 0x151:
                                        case 0x152:
                                        case 0x153:
                                        case 0x154:
                                        case 0x155:
                                        case 0x156:
                                        case 0x157:
                                        case 0x158:
                                        case 0x159:
                                        case 0x15a:
                                        case 0x15b:
                                        case 0x15c:
                                        case 0x15d:
                                        case 0x15e:
                                        case 0x15f:
                                        case 0x160:
                                        case 0x161:
                                        case 0x162:
                                        case 0x163:
                                        case 0x164:
                                        case 0x165:
                                        case 0x166:
                                        case 0x167:
                                        case 0x168:
                                        case 0x169:
                                        case 0x16a:
                                        case 0x16b:
                                        case 0x16c:
                                        case 0x16d:
                                        case 0x16e:
                                        case 0x16f:
                                        case 0x170:
                                        case 0x171:
                                        case 0x172:
                                        case 0x173:
                                        case 0x174:
                                        case 0x175:
                                        case 0x176:
                                        case 0x177:
                                        case 0x178:
                                        case 0x179:
                                        case 0x17a:
                                        case 0x17b:
                                        case 0x17c:
                                        case 0x17d:
                                        case 0x17e:
                                        case 0x17f:
                                        case 0x180:
                                        case 0x181:
                                        case 0x182:
                                        case 0x183:
                                        case 0x184:
                                        case 0x185:
                                        case 0x186:
                                        case 0x187:
                                        case 0x188:
                                        case 0x189:
                                        case 0x18a:
                                        case 0x18b:
                                        case 0x18c:
                                        case 0x18d:
                                        case 0x18e:
                                        case 0x18f:
                                        case 0x190:
                                        case 0x191:
                                        case 0x192:
                                        case 0x193:
                                        case 0x194:
                                        case 0x195:
                                        case 0x196:
                                        case 0x197:
                                        case 0x198:
                                        case 0x199:
                                        case 0x19a:
                                        case 0x19b:
                                        case 0x19c:
                                        case 0x19d:
                                        case 0x19e:
                                        case 0x19f:
                                        case 0x1a0:
                                        case 0x1a1:
                                        case 0x1a2:
                                        case 0x1a3:
                                        case 0x1a4:
                                        case 0x1a5:
                                        case 0x1a6:
                                        case 0x1a7:
                                        case 0x1a8:
                                        case 0x1a9:
                                        case 0x1aa:
                                        case 0x1ab:
                                        case 0x1ac:
                                        case 0x1ad:
                                        case 0x1ae:
                                        case 0x1b0:
                                        case 0x1b1:
                                        case 0x1b2:
                                        case 0x1b3:
                                        case 0x1b4:
                                        case 0x1b5:
                                        case 0x1b7:
                                        case 0x1b8:
                                        case 0x1b9:
                                        case 0x1ba:
                                        case 0x1bb:
                                        case 0x1bc:
                                        case 0x1bd:
                                        case 0x1bf:
                                        case 0x1c0:
                                        default:
                                            vc(6);
                                    }
                                    break;
                            }
                    }
                }
            } while (--Ma);
        } catch (Ge)
        {
            var He;
            He = 0;
            for (Pa = 0; ; Pa++)
            {
                try
                {
                    if (Ge.hasOwnProperty("intno"))
                    {
                        Od(Ge.intno, 0, Ge.error_code, 0, 0);
                    } else
                    {
                        He = -1;
                    }
                    break;
                } catch (Ie)
                {
                    Ge = Ie;
                }
            }
            if (!He)
                continue;
            else
                throw Ge;
        }
        break;
    }
    this.cycle_count += (xa - Ma);
    this.eip = Hb;
    this.cc_src = Aa;
    this.cc_dst = Ba;
    this.cc_op = Ca;
    this.cc_op2 = Da;
    this.cc_dst2 = Ea;
    return Na;
};

// Load binary file into memory
ea.prototype.load_binary = function(url, memAddress)
{
    var xhr, fileContent, fileLength, i, bytesArray;
    xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    if ('mozResponseType' in xhr)
    {
        xhr.mozResponseType = 'arraybuffer';
    } else if ('responseType' in xhr)
    {
        xhr.responseType = 'arraybuffer';
    } else
    {
        xhr.overrideMimeType('text/plain; charset=x-user-defined');
    }
    xhr.send(null);
    if (xhr.status != 200 && xhr.status != 0)
    {
        throw "Error while loading " + url;
    }
    if ('mozResponse' in xhr)
    {
        fileContent = xhr.mozResponse;
    }
    else if (xhr.mozResponseArrayBuffer)
    {
        fileContent = xhr.mozResponseArrayBuffer;
    }
    else if ('responseType' in xhr)
    {
        fileContent = xhr.response;
    }
    else
    {
        fileContent = xhr.responseText;
    }
    fileLength = fileContent.byteLength;
    bytesArray = new Uint8Array(fileContent, 0, fileLength);
    for (i = 0; i < fileLength; i++)
    {
        this.st8_phys(memAddress + i, bytesArray[i]);
    }
    return fileLength;
};

//
function Oe(a)
{
    return ((a / 10) << 4) | (a % 10);
}

function Pe(Qe)
{
    var Re, d;
    Re = new Uint8Array(128);
    this.cmos_data = Re;
    this.cmos_index = 0;
    d = new Date();
    Re[0] = Oe(d.getUTCSeconds());
    Re[2] = Oe(d.getUTCMinutes());
    Re[4] = Oe(d.getUTCHours());
    Re[6] = Oe(d.getUTCDay());
    Re[7] = Oe(d.getUTCDate());
    Re[8] = Oe(d.getUTCMonth() + 1);
    Re[9] = Oe(d.getUTCFullYear() % 100);
    Re[10] = 0x26;
    Re[11] = 0x02;
    Re[12] = 0x00;
    Re[13] = 0x80;
    Re[0x14] = 0x02;
    Qe.register_ioport_write(0x70, 2, 1, this.ioport_write.bind(this));
    Qe.register_ioport_read(0x70, 2, 1, this.ioport_read.bind(this));
}

Pe.prototype.ioport_write = function(ha, Me)
{
    if (ha == 0x70)
    {
        this.cmos_index = Me & 0x7f;
    }
};
Pe.prototype.ioport_read = function(ha)
{
    var He;
    if (ha == 0x70)
    {
        return 0xff;
    } else
    {
        He = this.cmos_data[this.cmos_index];
        if (this.cmos_index == 10)
            this.cmos_data[10] ^= 0x80;
        else if (this.cmos_index == 12)
            this.cmos_data[12] = 0x00;
        return He;
    }
};
function Se(Qe, Te)
{
    Qe.register_ioport_write(Te, 2, 1, this.ioport_write.bind(this));
    Qe.register_ioport_read(Te, 2, 1, this.ioport_read.bind(this));
    this.reset();
}
Se.prototype.reset = function()
{
    this.last_irr = 0;
    this.irr = 0;
    this.imr = 0;
    this.isr = 0;
    this.priority_add = 0;
    this.irq_base = 0;
    this.read_reg_select = 0;
    this.special_mask = 0;
    this.init_state = 0;
    this.auto_eoi = 0;
    this.rotate_on_autoeoi = 0;
    this.init4 = 0;
    this.elcr = 0;
    this.elcr_mask = 0;
};
Se.prototype.set_irq1 = function(Ue, Ve)
{
    var We;
    We = 1 << Ue;
    if (Ve)
    {
        if ((this.last_irr & We) == 0)
            this.irr |= We;
        this.last_irr |= We;
    } else
    {
        this.last_irr &= ~We;
    }
};
Se.prototype.get_priority = function(We)
{
    var Xe;
    if (We == 0)
        return -1;
    Xe = 7;
    while ((We & (1 << ((Xe + this.priority_add) & 7))) == 0)
        Xe--;
    return Xe;
};
Se.prototype.get_irq = function()
{
    var We, Ye, Xe;
    We = this.irr & ~this.imr;
    Xe = this.get_priority(We);
    if (Xe < 0)
        return -1;
    Ye = this.get_priority(this.isr);
    if (Xe > Ye)
    {
        return Xe;
    } else
    {
        return -1;
    }
};
Se.prototype.intack = function(Ue)
{
    if (this.auto_eoi)
    {
        if (this.rotate_on_auto_eoi)
            this.priority_add = (Ue + 1) & 7;
    } else
    {
        this.isr |= (1 << Ue);
    }
    if (!(this.elcr & (1 << Ue)))
        this.irr &= ~(1 << Ue);
};

Se.prototype.ioport_write = function(ha, ia)
{
    var Xe;
    ha &= 1;
    if (ha == 0)
    {
        if (ia & 0x10)
        {
            this.reset();
            this.init_state = 1;
            this.init4 = ia & 1;
            if (ia & 0x02)
                throw "single mode not supported";
            if (ia & 0x08)
                throw "level sensitive irq not supported";
        } 
        else if (ia & 0x08)
        {
            if (ia & 0x02)
                this.read_reg_select = ia & 1;
            if (ia & 0x40)
                this.special_mask = (ia >> 5) & 1;
        } 
        else
        {
            switch (ia)
            {
                case 0x00:
                case 0x80:
                    this.rotate_on_autoeoi = ia >> 7;
                    break;
                case 0x20:
                case 0xa0:
                    Xe = this.get_priority(this.isr);
                    if (Xe >= 0)
                    {
                        this.isr &= ~(1 << ((Xe + this.priority_add) & 7));
                    }
                    if (ia == 0xa0)
                        this.priority_add = (this.priority_add + 1) & 7;
                    break;
                case 0x60:
                case 0x61:
                case 0x62:
                case 0x63:
                case 0x64:
                case 0x65:
                case 0x66:
                case 0x67:
                    Xe = ia & 7;
                    this.isr &= ~(1 << Xe);
                    break;
                case 0xc0:
                case 0xc1:
                case 0xc2:
                case 0xc3:
                case 0xc4:
                case 0xc5:
                case 0xc6:
                case 0xc7:
                    this.priority_add = (ia + 1) & 7;
                    break;
                case 0xe0:
                case 0xe1:
                case 0xe2:
                case 0xe3:
                case 0xe4:
                case 0xe5:
                case 0xe6:
                case 0xe7:
                    Xe = ia & 7;
                    this.isr &= ~(1 << Xe);
                    this.priority_add = (Xe + 1) & 7;
                    break;
            }
        }
    } 
    else
    {
        switch (this.init_state)
        {
            case 0:
                this.imr = ia;
                this.update_irq();
                break;
            case 1:
                this.irq_base = ia & 0xf8;
                this.init_state = 2;
                break;
            case 2:
                if (this.init4)
                {
                    this.init_state = 3;
                } else
                {
                    this.init_state = 0;
                }
                break;
            case 3:
                this.auto_eoi = (ia >> 1) & 1;
                this.init_state = 0;
                break;
        }
    }
};

Se.prototype.ioport_read = function(Ze)
{
    var ha, He;
    ha = Ze & 1;
    if (ha == 0)
    {
        if (this.read_reg_select)
            He = this.isr;
        else
            He = this.irr;
    } else
    {
        He = this.imr;
    }
    return He;
};
function af(Qe, bf, Ze, cf)
{
    this.pics = new Array();
    this.pics[0] = new Se(Qe, bf);
    this.pics[1] = new Se(Qe, Ze);
    this.pics[0].elcr_mask = 0xf8;
    this.pics[1].elcr_mask = 0xde;
    this.irq_requested = 0;
    this.cpu_set_irq = cf;
    this.pics[0].update_irq = this.update_irq.bind(this);
    this.pics[1].update_irq = this.update_irq.bind(this);
}
af.prototype.update_irq = function()
{
    var df, Ue;
    df = this.pics[1].get_irq();
    if (df >= 0)
    {
        this.pics[0].set_irq1(2, 1);
        this.pics[0].set_irq1(2, 0);
    }
    Ue = this.pics[0].get_irq();
    if (Ue >= 0)
    {
        this.cpu_set_irq(1);
    } else
    {
        this.cpu_set_irq(0);
    }
};
af.prototype.set_irq = function(Ue, Ve)
{
    this.pics[Ue >> 3].set_irq1(Ue & 7, Ve);
    this.update_irq();
};
af.prototype.get_hard_intno = function()
{
    var Ue, df, intno;
    Ue = this.pics[0].get_irq();
    if (Ue >= 0)
    {
        this.pics[0].intack(Ue);
        if (Ue == 2)
        {
            df = this.pics[1].get_irq();
            if (df >= 0)
            {
                this.pics[1].intack(df);
            } else
            {
                df = 7;
            }
            intno = this.pics[1].irq_base + df;
            Ue = df + 8;
        } else
        {
            intno = this.pics[0].irq_base + Ue;
        }
    } else
    {
        Ue = 7;
        intno = this.pics[0].irq_base + Ue;
    }
    this.update_irq();
    return intno;
};
function ef()
{
    return ya.cycle_count;
}
function ff(Qe, gf)
{
    var s, i;
    this.pit_channels = new Array();
    for (i = 0; i < 3; i++)
    {
        s = new hf();
        this.pit_channels[i] = s;
        s.mode = 3;
        s.gate = (i != 2) >> 0;
        s.pit_load_count(0);
    }
    this.speaker_data_on = 0;
    this.set_irq = gf;
    Qe.register_ioport_write(0x40, 4, 1, this.ioport_write.bind(this));
    Qe.register_ioport_read(0x40, 3, 1, this.ioport_read.bind(this));
    Qe.register_ioport_read(0x61, 1, 1, this.speaker_ioport_read.bind(this));
    Qe.register_ioport_write(0x61, 1, 1, this.speaker_ioport_write.bind(this));
}
function hf()
{
    this.count = 0;
    this.latched_count = 0;
    this.rw_state = 0;
    this.mode = 0;
    this.bcd = 0;
    this.gate = 0;
    this.count_load_time = 0;
    this.pit_time_unit = 1193182 / 2000000;
}
hf.prototype.get_time = function()
{
    return Math.floor(ef() * this.pit_time_unit);
};
hf.prototype.pit_get_count = function()
{
    var d, jf;
    d = this.get_time() - this.count_load_time;
    switch (this.mode)
    {
        case 0:
        case 1:
        case 4:
        case 5:
            jf = (this.count - d) & 0xffff;
            break;
        default:
            jf = this.count - (d % this.count);
            break;
    }
    return jf;
};
hf.prototype.pit_get_out = function()
{
    var d, kf;
    d = this.get_time() - this.count_load_time;
    switch (this.mode)
    {
        default:
        case 0:
            kf = (d >= this.count) >> 0;
            break;
        case 1:
            kf = (d < this.count) >> 0;
            break;
        case 2:
            if ((d % this.count) == 0 && d != 0)
                kf = 1;
            else
                kf = 0;
            break;
        case 3:
            kf = ((d % this.count) < (this.count >> 1)) >> 0;
            break;
        case 4:
        case 5:
            kf = (d == this.count) >> 0;
            break;
    }
    return kf;
};
hf.prototype.get_next_transition_time = function()
{
    var d, lf, base, mf;
    d = this.get_time() - this.count_load_time;
    switch (this.mode)
    {
        default:
        case 0:
        case 1:
            if (d < this.count)
                lf = this.count;
            else
                return -1;
            break;
        case 2:
            base = (d / this.count) * this.count;
            if ((d - base) == 0 && d != 0)
                lf = base + this.count;
            else
                lf = base + this.count + 1;
            break;
        case 3:
            base = (d / this.count) * this.count;
            mf = ((this.count + 1) >> 1);
            if ((d - base) < mf)
                lf = base + mf;
            else
                lf = base + this.count;
            break;
        case 4:
        case 5:
            if (d < this.count)
                lf = this.count;
            else if (d == this.count)
                lf = this.count + 1;
            else
                return -1;
            break;
    }
    lf = this.count_load_time + lf;
    return lf;
};
hf.prototype.pit_load_count = function(ia)
{
    if (ia == 0)
        ia = 0x10000;
    this.count_load_time = this.get_time();
    this.count = ia;
};
ff.prototype.ioport_write = function(ha, ia)
{
    var nf, of, s;
    ha &= 3;
    if (ha == 3)
    {
        nf = ia >> 6;
        if (nf == 3)
            return;
        s = this.pit_channels[nf];
        of = (ia >> 4) & 3;
        switch (of)
        {
            case 0:
                s.latched_count = s.pit_get_count();
                s.rw_state = 4;
                break;
            default:
                s.mode = (ia >> 1) & 7;
                s.bcd = ia & 1;
                s.rw_state = of - 1 + 0;
                break;
        }
    } else
    {
        s = this.pit_channels[ha];
        switch (s.rw_state)
        {
            case 0:
                s.pit_load_count(ia);
                break;
            case 1:
                s.pit_load_count(ia << 8);
                break;
            case 2:
            case 3:
                if (s.rw_state & 1)
                {
                    s.pit_load_count((s.latched_count & 0xff) | (ia << 8));
                } else
                {
                    s.latched_count = ia;
                }
                s.rw_state ^= 1;
                break;
        }
    }
};
ff.prototype.ioport_read = function(ha)
{
    var He, oa, s;
    ha &= 3;
    s = this.pit_channels[ha];
    switch (s.rw_state)
    {
        case 0:
        case 1:
        case 2:
        case 3:
            oa = s.pit_get_count();
            if (s.rw_state & 1)
                He = (oa >> 8) & 0xff;
            else
                He = oa & 0xff;
            if (s.rw_state & 2)
                s.rw_state ^= 1;
            break;
        default:
        case 4:
        case 5:
            if (s.rw_state & 1)
                He = s.latched_count >> 8;
            else
                He = s.latched_count & 0xff;
            s.rw_state ^= 1;
            break;
    }
    return He;
};
ff.prototype.speaker_ioport_write = function(ha, ia)
{
    this.speaker_data_on = (ia >> 1) & 1;
    this.pit_channels[2].gate = ia & 1;
};
ff.prototype.speaker_ioport_read = function(ha)
{
    var kf, s, ia;
    s = this.pit_channels[2];
    kf = s.pit_get_out();
    ia = (this.speaker_data_on << 1) | s.gate | (kf << 5);
    return ia;
};
ff.prototype.update_irq = function()
{
    this.set_irq(1);
    this.set_irq(0);
};
function pf(Qe, ha, qf)
{
    this.divider = 0;
    this.rbr = 0;
    this.ier = 0;
    this.iir = 0x01;
    this.lcr = 0;
    this.mcr;
    this.lsr = 0x40 | 0x20;
    this.msr = 0;
    this.scr = 0;
    this.set_irq_func = qf;
    this.receive_fifo = "";
    Qe.register_ioport_write(0x3f8, 8, 1, this.ioport_write.bind(this));
    Qe.register_ioport_read(0x3f8, 8, 1, this.ioport_read.bind(this));
}

pf.prototype.update_irq = function()
{
    if ((this.lsr & 0x01) && (this.ier & 0x01))
    {
        this.iir = 0x04;
    } else if ((this.lsr & 0x20) && (this.ier & 0x02))
    {
        this.iir = 0x02;
    } else
    {
        this.iir = 0x01;
    }
    if (this.iir != 0x01)
    {
        this.set_irq_func(1);
    } else
    {
        this.set_irq_func(0);
    }
};

pf.prototype.ioport_write = function(ha, ia)
{
    ha &= 7;
    switch (ha)
    {
        default:
        case 0:
            if (this.lcr & 0x80)
            {
                this.divider = (this.divider & 0xff00) | ia;
            } 
            else
            {
                this.lsr &= ~0x20;
                this.update_irq();
                terminal.write(String.fromCharCode(ia));
                this.lsr |= 0x20;
                this.lsr |= 0x40;
                this.update_irq();
            }
            break;
        case 1:
            if (this.lcr & 0x80)
            {
                this.divider = (this.divider & 0x00ff) | (ia << 8);
            } 
            else
            {
                this.ier = ia;
                this.update_irq();
            }
            break;
        case 2:
            break;
        case 3:
            this.lcr = ia;
            break;
        case 4:
            this.mcr = ia;
            break;
        case 5:
            break;
        case 6:
            this.msr = ia;
            break;
        case 7:
            this.scr = ia;
            break;
    }
};

pf.prototype.ioport_read = function(ha)
{
    var He;
    ha &= 7;
    switch (ha)
    {
        default:
        case 0:
            if (this.lcr & 0x80)
            {
                He = this.divider & 0xff;
            } else
            {
                He = this.rbr;
                this.lsr &= ~(0x01 | 0x10);
                this.update_irq();
                this.send_char_from_fifo();
            }
            break;
        case 1:
            if (this.lcr & 0x80)
            {
                He = (this.divider >> 8) & 0xff;
            } else
            {
                He = this.ier;
            }
            break;
        case 2:
            He = this.iir;
            break;
        case 3:
            He = this.lcr;
            break;
        case 4:
            He = this.mcr;
            break;
        case 5:
            He = this.lsr;
            break;
        case 6:
            He = this.msr;
            break;
        case 7:
            He = this.scr;
            break;
    }
    return He;
};

pf.prototype.send_break = function()
{
    this.rbr = 0;
    this.lsr |= 0x10 | 0x01;
    this.update_irq();
};

//�����VM�����ַ�
pf.prototype.send_char = function(rf)
{
    this.rbr = rf;
    this.lsr |= 0x01;
    this.update_irq();
};

pf.prototype.send_char_from_fifo = function()
{
    var sf;
    sf = this.receive_fifo;
    if (sf != "" && !(this.lsr & 0x01))
    {
        this.send_char(sf.charCodeAt(0));
        this.receive_fifo = sf.substr(1, sf.length - 1);
    }
};

pf.prototype.send_chars = function(va)
{
    this.receive_fifo += va;
    this.send_char_from_fifo();
};

function tf(Qe, uf)
{
    Qe.register_ioport_read(0x64, 1, 1, this.read_status.bind(this));
    Qe.register_ioport_write(0x64, 1, 1, this.write_command.bind(this));
    this.reset_request = uf;
}

tf.prototype.read_status = function(ha)
{
    return 0;
};

tf.prototype.write_command = function(ha, ia)
{
    switch (ia)
    {
        case 0xfe:
            this.reset_request();
            break;
        default:
            break;
    }
};
function vf(Qe, Te, wf)
{
    Qe.register_ioport_read(Te, 16, 4, this.ioport_readl.bind(this));
    Qe.register_ioport_write(Te, 16, 4, this.ioport_writel.bind(this));
    Qe.register_ioport_read(Te + 8, 1, 1, this.ioport_readb.bind(this));
    Qe.register_ioport_write(Te + 8, 1, 1, this.ioport_writeb.bind(this));
    this.doc_el = wf;
    this.cur_pos = 0;
    this.doc_str = "";
}
vf.prototype.ioport_writeb = function(ha, ia)
{
    this.doc_str += String.fromCharCode(ia);
};
vf.prototype.ioport_readb = function(ha)
{
    var c, va, ia;
    va = this.doc_str;
    if (this.cur_pos < va.length)
    {
        ia = va.charCodeAt(this.cur_pos) & 0xff;
    } else
    {
        ia = 0;
    }
    this.cur_pos++;
    return ia;
};
vf.prototype.ioport_writel = function(ha, ia)
{
    var va;
    ha = (ha >> 2) & 3;
    switch (ha)
    {
        case 0:
            this.doc_str = this.doc_str.substr(0, ia >>> 0);
            break;
        case 1:
            return this.cur_pos = ia >>> 0;
        case 2:
            va = String.fromCharCode(ia & 0xff)
				+ String.fromCharCode((ia >> 8) & 0xff)
				+ String.fromCharCode((ia >> 16) & 0xff)
				+ String.fromCharCode((ia >> 24) & 0xff);
            this.doc_str += va;
            break;
        case 3:
            this.doc_el.value = this.doc_str;
    }
};
vf.prototype.ioport_readl = function(ha)
{
    var ia;
    ha = (ha >> 2) & 3;
    switch (ha)
    {
        case 0:
            this.doc_str = this.doc_el.value;
            return this.doc_str.length >> 0;
        case 1:
            return this.cur_pos >> 0;
        case 2:
            ia = this.ioport_readb(0);
            ia |= this.ioport_readb(0) << 8;
            ia |= this.ioport_readb(0) << 16;
            ia |= this.ioport_readb(0) << 24;
            return ia;
        case 3:
            return 0;
    }
};
function cf(Ve)
{
    this.hard_irq = Ve;
}
function xf(yf)
{
    this.init_ioports();
    this.register_ioport_write(0x80, 1, 1, this.ioport80_write);
    this.pic = new af(this, 0x20, 0xa0, cf.bind(ya));
    this.pit = new ff(this, this.pic.set_irq.bind(this.pic, 0));
    this.cmos = new Pe(this);
    this.serial = new pf(this, 0x3f8, this.pic.set_irq.bind(this.pic, 4));
    this.kbd = new tf(this, this.reset.bind(this));
    this.reset_request = 0;
    if (yf.jsclipboard_el)
    {
        this.jsclipboard = new vf(this, 0x3c0, yf.jsclipboard_el);
    }
}
xf.prototype.init_ioports = function()
{
    var i;
    this.ioport_readb_table = new Array();
    this.ioport_writeb_table = new Array();
    this.ioport_readw_table = new Array();
    this.ioport_writew_table = new Array();
    this.ioport_readl_table = new Array();
    this.ioport_writel_table = new Array();
    for (i = 0; i < 1024; i++)
    {
        this.ioport_readb_table[i] = this.default_ioport_readb;
        this.ioport_writeb_table[i] = this.default_ioport_writeb;
        this.ioport_readw_table[i] = this.default_ioport_readw;
        this.ioport_writew_table[i] = this.default_ioport_writew;
        this.ioport_readl_table[i] = this.default_ioport_readl;
        this.ioport_writel_table[i] = this.default_ioport_writel;
    }
};

xf.prototype.default_ioport_readb = function(Te)
{
    var ia;
    ia = 0xff;
    return ia;
};

xf.prototype.default_ioport_readw = function(Te)
{
    var ia;
    ia = this.default_ioport_readb[Te](Te);
    Te = (Te + 1) & (1024 - 1);
    ia |= this.default_ioport_readb[Te](Te) << 8;
    return ia;
};

xf.prototype.default_ioport_readl = function(Te)
{
    var ia;
    ia = -1;
    return ia;
};

xf.prototype.default_ioport_writeb = function(Te, ia)
{
};

xf.prototype.default_ioport_writew = function(Te, ia)
{
    this.ioport_writeb_table[Te](Te, ia & 0xff);
    Te = (Te + 1) & (1024 - 1);
    this.ioport_writeb_table[Te](Te, (ia >> 8) & 0xff);
};

xf.prototype.default_ioport_writel = function(Te, ia)
{
};

xf.prototype.ld8_port = function(Te)
{
    var ia;
    ia = this.ioport_readb_table[Te & (1024 - 1)](Te);
    return ia;
};

xf.prototype.ld16_port = function(Te)
{
    var ia;
    ia = this.ioport_readw_table[Te & (1024 - 1)](Te);
    return ia;
};

xf.prototype.ld32_port = function(Te)
{
    var ia;
    ia = this.ioport_readl_table[Te & (1024 - 1)](Te);
    return ia;
};

xf.prototype.st8_port = function(Te, ia)
{
    this.ioport_writeb_table[Te & (1024 - 1)](Te, ia);
};

xf.prototype.st16_port = function(Te, ia)
{
    this.ioport_writew_table[Te & (1024 - 1)](Te, ia);
};

xf.prototype.st32_port = function(Te, ia)
{
    this.ioport_writel_table[Te & (1024 - 1)](Te, ia);
};

xf.prototype.register_ioport_read = function(start, fd, zf, Af)
{
    var i;
    switch (zf)
    {
        case 1:
            for (i = start; i < start + fd; i++)
            {
                this.ioport_readb_table[i] = Af;
            }
            break;
        case 2:
            for (i = start; i < start + fd; i += 2)
            {
                this.ioport_readw_table[i] = Af;
            }
            break;
        case 4:
            for (i = start; i < start + fd; i += 4)
            {
                this.ioport_readl_table[i] = Af;
            }
            break;
    }
};

xf.prototype.register_ioport_write = function(start, fd, zf, Af)
{
    var i;
    switch (zf)
    {
        case 1:
            for (i = start; i < start + fd; i++)
            {
                this.ioport_writeb_table[i] = Af;
            }
            break;
        case 2:
            for (i = start; i < start + fd; i += 2)
            {
                this.ioport_writew_table[i] = Af;
            }
            break;
        case 4:
            for (i = start; i < start + fd; i += 4)
            {
                this.ioport_writel_table[i] = Af;
            }
            break;
    }
};

xf.prototype.ioport80_write = function(ha, Me)
{

};

xf.prototype.reset = function()
{
    this.request_request = 1;
};
var ya, Bf, Qe;

function Cf()
{
    var Na, Df, Ef, Ff, Gf;
    Ef = ya.cycle_count + 100000;
    Ff = false;
    Gf = false;
    Hf: while (ya.cycle_count < Ef)
    {
        Qe.pit.update_irq();
        Na = ya.exec(Ef - ya.cycle_count);
        if (Na == 256)
        {
            if (Qe.reset_request)
            {
                Ff = true;
                break;
            }
        } else if (Na == 257)
        {
            Gf = true;
            break;
        } else
        {
            Ff = true;
            break;
        }
    }
    if (!Ff)
    {
        if (Gf)
        {
            setTimeout(Cf, 10);
        } else
        {
            setTimeout(Cf, 0);
        }
    }
}
// Terminal
function initializeTerminal()
{
    terminal = new Term(120, 75, keyboardHandler);
    terminal.open();
}
//����Terminal�ϵ�����
function keyboardHandler(va)
{
    Qe.serial.send_chars(va);
}

//���������Ƿ�֧��typed array
function isBrowserSupportTypedArray()
{
    return (window.Uint8Array && window.Uint16Array && window.Int32Array && window.ArrayBuffer);
}

function start()
{
    var Lf, i, start, Mf, Nf, yf;
    if (!isBrowserSupportTypedArray())
    {
        terminal.writeln("");
        terminal.writeln("Your browser does not support the W3C Typed Arrays and this version of JS/Linux needs them.\n");
        terminal.writeln("If you really want to try out JS/Linux, you can use the following browsers:");
        terminal.writeln("- Firefox 4.x");
        terminal.writeln("- Google Chrome 11");
        return;
    }
    ya = new ea();
    yf = new Object();
    yf.jsclipboard_el = document.getElementById("text_clipboard");
    Qe = new xf(yf);
    Mf = 32 * 1024 * 1024;   //4G Memory
    ya.phys_mem_resize(Mf);
    ya.load_binary("vmlinux26.bin", 0x00100000);
    Nf = ya.load_binary("root.bin", 0x00400000);
    start = 0x10000;
    ya.load_binary("linuxstart.bin", start);
    ya.eip = start;         //Execute the code at 0x10000
    ya.regs[0] = Mf;
    ya.regs[3] = Nf;
    ya.cycle_count = 0;
    ya.ld8_port = Qe.ld8_port.bind(Qe);
    ya.ld16_port = Qe.ld16_port.bind(Qe);
    ya.ld32_port = Qe.ld32_port.bind(Qe);
    ya.st8_port = Qe.st8_port.bind(Qe);
    ya.st16_port = Qe.st16_port.bind(Qe);
    ya.st32_port = Qe.st32_port.bind(Qe);
    ya.get_hard_intno = Qe.pic.get_hard_intno.bind(Qe.pic);
    Bf = Date.now();
    setTimeout(Cf, 10);
}

function clear_clipboard()
{
    var clipboard = document.getElementById("text_clipboard");
    clipboard.value = "";
}
