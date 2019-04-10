package com.company;

/**
 * Created by shao on 2019/3/21.
 */
public class yichangexception {
    public static void main(String[] args) {
        yichangdemo de = new yichangdemo();
//        de.div(4,1);
         try {
             int xx = de.div(4,-1);
             System.out.println("xx="+xx);
         }
         catch (suanshuexception e){
             e.printStackTrace();
         }
         finally {
             System.out.println("必定被执行的部分,通常用于关闭资源，数据库等");
         }
    }
}


/*class  yichangdemo{
      int div(int a,int b) throws suanshuexception{
          if (b < 0)throw new suanshuexception("除数为负");
          return  a/b;
      }

}


class  suanshuexception extends Exception{
    suanshuexception( String msg){
        super(msg);
    }
}*/
class  yichangdemo {
    int div(int a, int b) {
        if (b < 0) throw new suanshuexception("除数为负");
        return a / b;
    }
}

class  suanshuexception extends RuntimeException {
    suanshuexception(String msg) {
        super(msg);
    }
}






