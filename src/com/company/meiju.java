package com.company;

import java.util.Enumeration;
import java.util.Vector;

/**
 * Created by shao on 2019/4/15.
 */
public class meiju {
    public static void main(String[] args) {
        Enumeration<String> days;
        Vector<String> dayNames = new Vector<String>();
        dayNames.add("Sunday");
        dayNames.add("Monday");
        dayNames.add("Tuesday");
        dayNames.add("Wednesday");
        dayNames.add("Thursday");
        dayNames.add("Friday");
        dayNames.add("Saturday");
        days = dayNames.elements();
        while (days.hasMoreElements()){
            System.out.println(days.nextElement());
            System.out.println(days);
        }
    }
}
