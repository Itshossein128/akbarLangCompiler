#include <iostream>
#include <string>
using namespace std;

int main() {
  // Declare temporary variables
  sconst string t0;
  int t1;
  int t2;
  int t3;
  int t6;
  int t7;
  sconst string t8;
  sconst string t9;
  
  t0 = "Enter a number to calculate factorial: ";
  cout << t0 << endl;
  cin >> n;
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
  cout << t8 << endl;
  cout << n << endl;
  t9 = " is: ";
  cout << t9 << endl;
  cout << factorial << endl;
  return 0;
}