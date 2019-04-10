package com.company;

import com.sun.scenario.effect.impl.sw.sse.SSEBlend_SRC_OUTPeer;

/**
 * Created by shao on 2019/2/26.
 * 多态
 *事务存在的多种体现形态
 *多态的基本体现
 * 多态的前提
 * 多态的应用
 */
abstract class dt {
   abstract  void eat();
}
class  cat extends  dt{
    public  void eat(){
        System.out.println("11");
    }
    //用catch 不行，可能是catch是默认的认识
    public  void  catch3(){
        System.out.println("han");
    }
}
class dog extends dt{
    public void eat(){
        System.out.println("223");

        }
        public  void df(){
            System.out.println("jiao");
        }

        }

 class duotai{
public static void main(String[]args){
      //function(new cat());
    dt d = new cat();d.eat();//向上转型
      function(new dog());
      /*cat c = (cat) d;//向下转型
      c.catch3(); */

        }
        public static void function(dt d){
        d.eat();
        if (d instanceof  cat){
        cat y= (cat)d;
        y.catch3();
     }
     /*else if (d instanceof  dog){
            dog x = (dog) d;
            x.df();
            }*/
        }
}


