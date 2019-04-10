package com.company;

import org.omg.CORBA.PRIVATE_MEMBER;

/**
 * Created by shao on 2019/4/9.
 */
public class producerdemo {
    public static void main(String[] args) {
        resouce res= new resouce();
        produce pro= new produce(res);
        customer cus= new customer(res);
        Thread t1=new Thread(pro);
        Thread t2= new Thread(cus);
        t1.start();




    }
}

class resouce{

    private  String name;
    private  int count =  1;
    private  boolean flag = false;
    public  synchronized void set (String name){
        while (flag)
            try {
            wait();
            }catch (Exception e){};
        this.name=name+"---"+count++;
        System.out.println(Thread.currentThread().getName()+"生产者"+this.name);
        flag = true;
        this.notify();
    }

    public synchronized  void out() {
        while (!flag)
            try {
            wait();
            }catch (Exception e){};
        System.out.println(Thread.currentThread().getName()+"消费者........"+this.name);
        flag=false;
        this.notify();

    }


}



class  produce implements  Runnable{

    private resouce res;
    produce(resouce res){
        this.res = res;
    }

    public void  run(){

        while (true){
            res.set("商品");
        }
    }

}

class  customer implements Runnable{
    private  resouce res;
    customer(resouce res){
        this.res = res;
    }
    public  void run(){
        while (true){
            res.out();
        }
    }
}


