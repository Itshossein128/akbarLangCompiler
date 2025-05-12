#include <iostream>
#include <string>

int main() {
  // Declare variables
  int n;
  int factorial;
  int i;
  std::string t0;
  int t1;
  int t2;
  int t3;
  int t4;
  int t5;
  int t6;
  int t7;
  std::string t8;
  std::string t9;
  
  t0 = "Enter a number to calculate factorial: ";
  std::cout << t0 << std::endl;
  std::cin >> n;
  t1 = 1;
  factorial = t1;
  t2 = 1;
  i = t2;
  t3 = 1;
  i = t3;
  t4 = i <= n;
  t5 = 1;
  t6 = 2;
  i = t6;
  {
    t7 = factorial * i;
    factorial = t7;
  }
  t8 = "Factorial of ";
  std::cout << t8 << std::endl;
  std::cout << n << std::endl;
  t9 = " is: ";
  std::cout << t9 << std::endl;
  std::cout << factorial << std::endl;
  return 0;
}