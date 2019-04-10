package com.company;

/**
 * Created by shao on 2019/2/27.
 */
class duotai2 {
    int num = 3;
    void method1(){
        System.out.println("fulei_1");
    };
    void method2(){
        System.out.println("fulei_2");
    }
    static  void method5(){
        System.out.println("fulei_5");
    }

}

 class  zilei2 extends  duotai2{
    int num = 4;
    void method1(){
        System.out.println("zilei_1");
    }

    void method3(){
        System.out.println("zilei_3");
    }
    static  void method5(){
        System.out.println("zilei_5");
    }
}


class  demo3 {
public static void main(String[]args){
    duotai2 f = new zilei2();
    f.method1();
    f.method2();
    System.out.println(f.num);
    f.method5();


        }
        }
