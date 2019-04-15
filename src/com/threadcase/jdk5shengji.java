package com.threadcase;
/*
* 用LOCK代替synchronized.一个锁可以对应多个condition对象 可以有选择性的唤醒线程
* */
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class jdk5shengji {
    public static void main(String[] args) {
        resouce res= new resouce();
        produce pro= new produce(res);
        customer cus= new customer(res);
        Thread t1=new Thread(pro);
        Thread t2= new Thread(cus);
        t1.start();
        t2.start();
    }

}

class resouce {

    private String name;
    private int count = 1;
    private boolean flag = false;
    private Lock lock = new ReentrantLock();
    private Condition condition = lock.newCondition();
    private Condition conditioncus = lock.newCondition();
    public synchronized void set(String name)  throws Exception{
        lock.lock();
        try {
            while (flag)
                condition.await();
            this.name = name + "---" + count++;
            System.out.println(Thread.currentThread().getName() + "生产者" + this.name);
            flag = true;
            conditioncus.signal();
        }
        finally {
            lock.unlock();
        }

    }
    public  void out() throws Exception{
        lock.lock();
            try {
                while (!flag)
                conditioncus.await();
                System.out.println(Thread.currentThread().getName()+"消费者........"+this.name);
                flag=false;
                condition.signal();
            }
        finally {
                lock.unlock();
            }


    }

}

class  produce implements  Runnable{

    private resouce res;
    produce(resouce res){
        this.res = res;
    }

    public void  run(){

        while (true){
            try {
                res.set("商品");
            }
            catch (Exception e){
                e.printStackTrace();
            }
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
            try {
                res.out();
            }catch (Exception e){
                e.printStackTrace();
            }

        }
    }
}