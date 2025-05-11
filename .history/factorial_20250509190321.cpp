#include <iostream>
#include <string>
use standard namespace;

int main() {
  // Declare temporary variables
  const std::string t0;
  int t1;
  int t2;
  int t3;
  int t6;
  int t7;
  const std::string t8;
  const std::string t9;
  
  t0 = "Enter a number to calculate factorial: ";
  std::cout << t0 << std::endl;
  std::cin >> n;
  t1 = 1;
  int factorial = t1;
  t2 = 1;
  int i = t2;
  t3 = 1;
  i = t3;
L0:
  t4 = i <= n;
  if (!(t4)) goto L1;
  {
    t5 = factorial * i;
    factorial = t5;
  }
  t6 = 1;
  t7 = 2;
  i = t7;
  goto L0;
L1:
  t8 = "Factorial of ";
  std::cout << t8 << std::endl;
  std::cout << n << std::endl;
  t9 = " is: ";
  std::cout << t9 << std::endl;
  std::cout << factorial << std::endl;
  return 0;
}