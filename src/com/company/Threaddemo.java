package com.company;

/**
 * Created by shao on 2019/3/29.
 */
public class Threaddemo {
    public static void main(String[] args) {
        demo1 de = new demo1();
        de.start();// 开启线程并执行该线程的run方法
        //de.run();仅仅是对象的调用，线程 创建未运行
        //Thread类中run方法用于存储线程要运行的代码
        for (int x=0;x<400;x++)
        System.out.println("main运行"+x);
    }
}
//多线程的运行在互相抢夺CPU的执行权，随机性特性

class demo1  extends  Thread{
     public void  run(){  //覆写run方法，将自定义代码存放在run中
         for ( int x=0;x<400;x++)
        System.out.println(this.getName()+"第二线程运行"+x);
    }
}