'use strict';

// =============================================================================
// SOKOBAN MAPS
// Source: sokoban-maps-60-plain.txt
// Downloaded from: https://github.com/begoon/sokoban-maps/blob/master/maps/sokoban-maps-60-plain.txt
// =============================================================================
const MAPS_RAW = `*************************************
Maze: 1
File offset: 148C, DS:00FC, table offset: 0000
Size X: 22
Size Y: 11
End: 14BD
Length: 50

    XXXXX             
    X   X             
    X*  X             
  XXX  *XXX           
  X  *  * X           
XXX X XXX X     XXXXXX
X   X XXX XXXXXXX  ..X
X *  *             ..X
XXXXX XXXX X@XXXX  ..X
    X      XXX  XXXXXX
    XXXXXXXX          

*************************************
Maze: 2
File offset: 14BE, DS:012E, table offset: 0032
Size X: 14
Size Y: 10
End: 14E8
Length: 43

XXXXXXXXXXXX  
X..  X     XXX
X..  X *  *  X
X..  X*XXXX  X
X..    @ XX  X
X..  X X  * XX
XXXXXX XX* * X
  X *  * * * X
  X    X     X
  XXXXXXXXXXXX

*************************************
Maze: 3
File offset: 14E9, DS:0159, table offset: 005D
Size X: 17
Size Y: 10
End: 150D
Length: 37

        XXXXXXXX 
        X     @X 
        X *X* XX 
        X *  *X  
        XX* * X  
XXXXXXXXX * X XXX
X....  XX *  *  X
XX...    *  *   X
X....  XXXXXXXXXX
XXXXXXXX         

*************************************
Maze: 4
File offset: 150E, DS:017E, table offset: 0082
Size X: 22
Size Y: 13
End: 154D
Length: 64

              XXXXXXXX
              X  ....X
   XXXXXXXXXXXX  ....X
   X    X  * *   ....X
   X ***X*  * X  ....X
   X  *     * X  ....X
   X ** X* * *XXXXXXXX
XXXX  * X     X       
X   X XXXXXXXXX       
X    *  XX            
X **X** @X            
X   X   XX            
XXXXXXXXX             

*************************************
Maze: 5
File offset: 154E, DS:01BE, table offset: 00C2
Size X: 17
Size Y: 13
End: 1580
Length: 51

        XXXXX    
        X   XXXXX
        X X*XX  X
        X     * X
XXXXXXXXX XXX   X
X....  XX *  *XXX
X....    * ** XX 
X....  XX*  * @X 
XXXXXXXXX  *  XX 
        X * *  X 
        XXX XX X 
          X    X 
          XXXXXX 

*************************************
Maze: 6
File offset: 1581, DS:01F1, table offset: 00F5
Size X: 12
Size Y: 11
End: 15AC
Length: 44

XXXXXX  XXX 
X..  X XX@XX
X..  XXX   X
X..     ** X
X..  X X * X
X..XXX X * X
XXXX * X*  X
   X  *X * X
   X *  *  X
   X  XX   X
   XXXXXXXXX

*************************************
Maze: 7
File offset: 15AD, DS:021D, table offset: 0121
Size X: 13
Size Y: 12
End: 15D8
Length: 44

       XXXXX 
 XXXXXXX   XX
XX X @XX ** X
X    *      X
X  *  XXX   X
XXX XXXXX*XXX
X *  XXX ..X 
X * * * ...X 
X    XXX...X 
X ** X X...X 
X  XXX XXXXX 
XXXX         

*************************************
Maze: 8
File offset: 15D9, DS:0249, table offset: 014D
Size X: 16
Size Y: 17
End: 161A
Length: 66

  XXXX          
  X  XXXXXXXXXXX
  X    *   * * X
  X *X * X  *  X
  X  * *  X    X
XXX *X X  XXXX X
X@X* * *  XX   X
X    * X*X   X X
XX  *    * * * X
 XXXX  XXXXXXXXX
  XXX  XXX      
  X      X      
  X      X      
  X......X      
  X......X      
  X......X      
  XXXXXXXX      

*************************************
Maze: 9
File offset: 161B, DS:028B, table offset: 018F
Size X: 17
Size Y: 18
End: 165D
Length: 67

          XXXXXXX
          X  ...X
      XXXXX  ...X
      X      ...X
      X  XX  ...X
      XX XX  ...X
     XXX XXXXXXXX
     X *** XX    
 XXXXX  * * XXXXX
XX   X* *   X   X
X@ *  *    *  * X
XXXXXX ** * XXXXX
     X *    X    
     XXXX XXX    
        X  X     
        X  X     
        X  X     
        XXXX     

*************************************
Maze: 10
File offset: 165E, DS:02CE, table offset: 01D2
Size X: 21
Size Y: 20
End: 16BE
Length: 97

              XXXX   
         XXXXXX  X   
         X       X   
         X  XXXX XXX 
 XXX  XXXXX XXX    X 
XX@XXXX   *** X    X 
X **   ** *   X....XX
X  ***X    *  X.....X
X *   X ** ** X.....X
XXX   X  *    X.....X
  X   X * * * X.....X
  X XXXXXXX XXX.....X
  X   X  * *  X.....X
  XXX X ** * *XXXXXXX
    X X  *      X    
    X X *** *** X    
    X X       X X    
    X XXXXXXXXX X    
    X           X    
    XXXXXXXXXXXXX    

*************************************
Maze: 11
File offset: 16BF, DS:032F, table offset: 0233
Size X: 19
Size Y: 15
End: 16FF
Length: 65

          XXXX     
     XXXX X  X     
   XXX  XXX* X     
  XX   @  *  X     
 XX  * **XX XX     
 X  X*XX     X     
 X X * ** X XXX    
 X   * X  X * XXXXX
XXXX    X  ** X   X
XXXX XX *         X
X.    XXX  XXXXXXXX
X.. ..X XXXX       
X...X.X            
X.....X            
XXXXXXX            

*************************************
Maze: 12
File offset: 1700, DS:0370, table offset: 0274
Size X: 13
Size Y: 16
End: 1741
Length: 66

  XXXXXXXXX  
  X&.&X&.&X  
  X.&.&.&.X  
  X&.&.&.&X  
  X.&.&.&.X  
  X&.&.&.&X  
  XXX   XXX  
    X   X    
XXXXXX XXXXXX
X           X
X * * * * * X
XX * * * * XX
 X* * * * *X 
 X   *@*   X 
 X  XXXXX  X 
 XXXX   XXXX 

*************************************
Maze: 13
File offset: 1742, DS:03B2, table offset: 02B6
Size X: 20
Size Y: 13
End: 178D
Length: 76

    XXXXXXXXX       
  XXX   XX  XXXXX   
XXX      X  X   XXXX
X  ** X* X  X  ... X
X X  *X@*XX X X.X. X
X  XX X*  X    ... X
X *X    * X X X.X. X
X    XX  XX* * ... X
X * XX   X  X*X.X. X
XX **  *   *  *... X
 X*  XXXXXX    XX  X
 X   X    XXXXXXXXXX
 XXXXX              

*************************************
Maze: 14
File offset: 178E, DS:03FE, table offset: 0302
Size X: 17
Size Y: 13
End: 17C7
Length: 58

XXXXXXXXXXXXXXXX 
X              X 
X X XXXXXX     X 
X X  * * * *X  X 
X X   *@*   XX XX
X X X* * *XXX...X
X X   * *  XX...X
X XXX*** * XX...X
X     X XX XX...X
XXXXX   XX XX...X
    XXXXX     XXX
        X     X  
        XXXXXXX  

*************************************
Maze: 15
File offset: 17C8, DS:0438, table offset: 033C
Size X: 17
Size Y: 17
End: 180F
Length: 72

       XXXX      
    XXXX  X      
   XX  X  X      
   X  * * X      
 XXX X*   XXXX   
 X  *  XX*   X   
 X  X @ * X *X   
 X  X      * XXXX
 XX XXXX*XX     X
 X *X.....X X   X
 X  *...&. *X XXX
XX  X.....X   X  
X   XXX XXXXXXX  
X **  X  X       
X  X     X       
XXXXXX   X       
     XXXXX       

*************************************
Maze: 16
File offset: 1810, DS:0480, table offset: 0384
Size X: 14
Size Y: 15
End: 184E
Length: 63

XXXXX         
X   XX        
X    X  XXXX  
X *  XXXX  X  
X  ** *   *X  
XXX@ X*    XX 
 X  XX  * * XX
 X *  XX XX .X
 X  X*XX*  X.X
 XXX   *..XX.X
  X    X.&...X
  X ** X.....X
  X  XXXXXXXXX
  X  X        
  XXXX        

*************************************
Maze: 17
File offset: 184F, DS:04BF, table offset: 03C3
Size X: 18
Size Y: 16
End: 1895
Length: 71

       XXXXXXX    
 XXXXXXX     X    
 X     X *@* X    
 X** X   XXXXXXXXX
 X XXX......XX   X
 X   *......XX X X
 X XXX......     X
XX   XXXX XXX X*XX
X  X*   X  *  X X 
X  * ***  X *XX X 
X   * * XXX** X X 
XXXXX     *   X X 
    XXX XXX   X X 
      X     X   X 
      XXXXXXXX  X 
             XXXX 

*************************************
Maze: 18
File offset: 1896, DS:0506, table offset: 040A
Size X: 22
Size Y: 13
End: 18DC
Length: 71

      XXXXXXXXXXXX    
      X  .  XX   X    
      X X.     @ X    
 XXXXXX XX...X XXXX   
XX  XX...XXXX     XXXX
X * XX...    * X  *  X
X     .. XX X XX XX  X
XXXX*XXX*X *  X   X XX
 XXX  X    XX* ** X X 
 X   ** X X * X *XX X 
 X                  X 
 XXXXXXXXXXXXXXXXX  X 
                 XXXX 

*************************************
Maze: 19
File offset: 18DD, DS:054D, table offset: 0451
Size X: 28
Size Y: 20
End: 1951
Length: 117

        XXXXXX              
        X   @XXXX           
      XXXXX *   X           
      X   XX    XXXX        
      X *XX  XX    X        
      X   X  XXXXX X        
      X X** *    X X        
      X  * * XXX X X        
      X X   *  X X X        
      X X  X*X   X X        
     XX XXXX   X X X        
     X  *  XXXXX X X XXXX   
    XX    *     *  XXX  XXXX
XXXXX  XXX * *X * X   .....X
X     XX      X  XX  X.....X
X ****    XXXXXX*XX   X.XX.X
XX    XX              X....X
 XX  XXXXXXXXXXXXXXX   ....X
  X  X             XXXXX  XX
  XXXX                 XXXX 

*************************************
Maze: 20
File offset: 1952, DS:05C2, table offset: 04C6
Size X: 20
Size Y: 20
End: 19B7
Length: 102

       XXXXXXXXXXXX 
       X..........X 
     XXX.X.X.X.X..X 
     X   .........X 
     X@ * * * &.&.X 
    XXXXXXX XXXXXXX 
 XXXX   X    XX  X  
XX    * X    X * XX 
X  X*X XXX XXX*   XX
X *  * *   X * * * X
X  X * XX       X* X
X   *XXXX*XXXX*XX  X
XXXX  XX   X    X  X
   X* XX   X X **  X
   X   X * X  *    X
   XXX X ** X  * XXX
     X X    X * XX  
     X XXXXXXXX X   
     X          X   
     XXXXXXXXXXXX   

*************************************
Maze: 21
File offset: 19B8, DS:0628, table offset: 052C
Size X: 16
Size Y: 14
End: 19F1
Length: 58

   XXXXXXXXXX   
   X..  X   X   
   X..      X   
   X..  X  XXXX 
  XXXXXXX  X  XX
  X            X
  X  X  XX  X  X
XXXX XX  XXXX XX
X  *  XXXXX X  X
X X *  *  X *  X
X @*  *   X   XX
XXXX XX XXXXXXX 
   X    X       
   XXXXXX       

*************************************
Maze: 22
File offset: 19F2, DS:0662, table offset: 0566
Size X: 22
Size Y: 20
End: 1A66
Length: 117

            XXXX      
 XXXXXXXXXXXX  XXXXX  
 X    X  X  *  X   XX 
 X * * *  * X * *   X 
 XX* *   X @X *   * X 
XXX   XXXXXXXXXXXX XX 
X  * *X  X......X *X  
X X   X  X......XX X  
X  XX XX X .....X  X  
X X      *...... * X  
X X * XX X......X  X  
X  * *X  X......X *X  
X *   X  XX*XXXXX  X  
X * * XXXX * *  * *X  
XX X     * * * *   XXX
 X  XXXXXX *    *    X
 X         X XXXXXXX X
 XXXXXXX X*          X
       X   XXXXXXXXXXX
       XXXXX          

*************************************
Maze: 23
File offset: 1A67, DS:06D7, table offset: 05DB
Size X: 25
Size Y: 14
End: 1AB7
Length: 81

       XXXXXXX           
       X  X  XXXX        
       X *X* X  XX       
XXXXXXXX  X  X   XXXXXXXX
X....  X *X* X  *X  X   X
X....X X     X*  X      X
X..X.    *X  X *    X*  X
X... @XX  X* X*  X  X   X
X.... XX *X     *XXXXXXXX
XXXXXXXX  X**X*  X       
       X *X  X  *X       
       X  X  X   X       
       XXXX  XXXXX       
          XXXX           

*************************************
Maze: 24
File offset: 1AB8, DS:0728, table offset: 062C
Size X: 21
Size Y: 19
End: 1B1F
Length: 104

   XXXXXXXXXX        
   X........XXXX     
   X.X.X....X  X     
   X........** X     
   X     .XXX  XXXX  
 XXXXXXXXX  * X   X  
 X     *   * *  * X  
 X  X    X  * *X  X  
 XX XXXXX   X  X  X  
 X *     X   XXXX X  
XX  *X   X XX  X  X  
X    XX*XXX    X  XX 
X *    * X  X  X   X 
XXXXX    X XX X XX XX
    X*X X  *  * *   X
    X@X  *X***  X   X
    XXX  *      XXXXX
      XX  X  X  X    
       XXXXXXXXXX    

*************************************
Maze: 25
File offset: 1B20, DS:0790, table offset: 0694
Size X: 23
Size Y: 17
End: 1B7C
Length: 93

               XXXX    
          XXXXXX  XXXXX
    XXXXXXX       X   X
    X      * * XX X X X
    X  XXXX *  X     .X
    X      * X X XX.X.X
    XX*XXXX* * * XX.X.X
    X     X    XXXX.XXX
    X *   XXXXXX  X.X.X
XXXXXX***XX      @X.X.X
X      X    X*X*XXX. .X
X XXXX X*****    X ...X
X X    *     X   X ...X
X X   XX XX     XXX...X
X XXXXXX*XXXXXX  XXXXXX
X        X    X  X     
XXXXXXXXXX    XXXX     

*************************************
Maze: 26
File offset: 1B7D, DS:07ED, table offset: 06F1
Size X: 15
Size Y: 15
End: 1BBB
Length: 63

XXXXXXXXX      
X       X      
X       XXXX   
XX XXXX X  X   
XX X@XX    X   
X *** *  **X   
X  X XX *  X   
X  X XX  * XXXX
XXXX  *** *X  X
 X   XX   ....X
 X X   X X.. .X
 X   X X XX...X
 XXXXX *  X...X
     XX   XXXXX
      XXXXX    

*************************************
Maze: 27
File offset: 1BBC, DS:082C, table offset: 0730
Size X: 23
Size Y: 13
End: 1C0B
Length: 80

 XXXXXXXXXXXXXXXXX     
 X...   X    X   XXX   
XX.....  *XX X X * X   
X......X  *  X  *  X   
X......X  X  X X X XX  
XXXXXXXXX *  * X X  XXX
  X     X*XX* XX XX   X
 XX   *    X *  *   X X
 X  XX XXX X  XXXXX*X X
 X * **     *   *     X
 X *    *XX* XXXXXXXX X
 XXXXXXX  @ XX      XXX
       XXXXXX          

*************************************
Maze: 28
File offset: 1C0C, DS:087C, table offset: 0780
Size X: 15
Size Y: 17
End: 1C54
Length: 73

     XXXXXXX   
     X@ X  X   
     X *   X   
    XXX XX X   
 XXXX *  X XX  
 X       X  XX 
 X * *XXXX * X 
 X ** X  X  *X 
 X*  *   X*  X 
XX  **X   ** XX
X **  X  X  * X
X     XXXX *  X
X  X*XX..XX   X
XXX .X....XXXXX
  X .......XX  
  X....   ..X  
  XXXXXXXXXXX  

*************************************
Maze: 29
File offset: 1C55, DS:08C5, table offset: 07C9
Size X: 24
Size Y: 11
End: 1C96
Length: 66

                XXXXX   
       XXXXXX XXX   XXXX
   XXXXX    XXX * *  * X
XXXX  XX X* *    * X   X
X....   ** * *  *   X*XX
X.. X XX X   XXX*XX X  X
X....    X XXX    X    X
X....    X XX  *  XXX* X
X..XXXXXX  *  X  XXXX XX
XXXX    X   XXX    @  X 
        XXXXXXXXXXXXXXX 

*************************************
Maze: 30
File offset: 1C97, DS:0907, table offset: 080B
Size X: 14
Size Y: 20
End: 1CE3
Length: 77

 XXXXX        
 X   XXXXXXX  
 X * XXX   X  
 X *    ** X  
 XX XXXX   X  
XXX X  X XXX  
X   X  X@XX   
X **    * X   
X   X X * XXXX
XXXXX X   X  X
 X   *XXXX   X
 X  *     *  X
 XX   XXXXX XX
 XXXXXXXXXX  X
XX....X *  * X
X.....X **X  X
X.. ..X *  * X
X.....*   X  X
XX  XXXXXXXXXX
 XXXX         

*************************************
Maze: 31
File offset: 1CE4, DS:0954, table offset: 0858
Size X: 15
Size Y: 12
End: 1D16
Length: 51

 XXXXXXX       
 X  X  XXXXX   
XX  X  X...XXX 
X  *X  X...  X 
X * X** ...  X 
X  *X  X... .X 
X   X *XXXXXXXX
XX*       * * X
XX  X  ** X   X
 XXXXXX  XX**@X
      X      XX
      XXXXXXXX 

*************************************
Maze: 32
File offset: 1D17, DS:0987, table offset: 088B
Size X: 18
Size Y: 16
End: 1D60
Length: 74

  XXXX            
  X  XXXXXXXXX    
 XX  XX @X   X    
 X  *X * *   XXXX 
 X*  *  X * *X  XX
XX  *XX X* *     X
X  X  X X   ***  X
X *    *  *XX XXXX
X * * X*X  X  X   
XX  XXX  XXX* X   
 X  X....     X   
 XXXX......XXXX   
   X....XXXX      
   X...XX         
   X...X          
   XXXXX          

*************************************
Maze: 33
File offset: 1D61, DS:09D1, table offset: 08D5
Size X: 13
Size Y: 15
End: 1D97
Length: 55

      XXXX   
  XXXXX  X   
 XX     *X   
XX *  XX XXX 
X@* * X *  X 
XXXX XX   *X 
 X....X* * X 
 X....X   *X 
 X....  ** XX
 X... X *   X
 XXXXXX* *  X
      X   XXX
      X* XXX 
      X  X   
      XXXX   

*************************************
Maze: 34
File offset: 1D98, DS:0A08, table offset: 090C
Size X: 12
Size Y: 15
End: 1DCB
Length: 52

XXXXXXXXXXXX
XX     XX  X
XX   *   * X
XXXX XX ** X
X   * X    X
X *** X XXXX
X   X X * XX
X  X  X  * X
X *X *X    X
X   ..X XXXX
XXXX.. * X@X
X.....X *X X
XX....X  * X
XXX..XX    X
XXXXXXXXXXXX

*************************************
Maze: 35
File offset: 1DCC, DS:0A3C, table offset: 0940
Size X: 20
Size Y: 16
End: 1E20
Length: 85

XXXXXXXXXXXX  XXXXXX
X   X    X@XXXX....X
X   **X       .....X
X   X XXX   XX ....X
XX XX XXX  X   ....X
 X * *     X XX XXXX
 X  * *XX  X       X
XXXX X  XXXX XX XX X
X  X X*   XX XX    X
X *  *  X XX XXXXXXX
X X * *    X X      
X  * XX XX X X      
X **     **  X      
XX XX XXX *  X      
 X    X X    X      
 XXXXXX XXXXXX      

*************************************
Maze: 36
File offset: 1E21, DS:0A91, table offset: 0995
Size X: 18
Size Y: 19
End: 1E7E
Length: 94

     XXXX         
   XXX  XX        
XXXX  *  X        
X   * *  XXXX     
X *   X *   X XXXX
X  X  X   * X X..X
XX*X* XXXX*XXXX..X
 X   XXXXX XX ...X
 X*X XX@XX XX  ..X
 X X    *     ...X
 X   XXXX XXX  ..X
 XXX XX X  XX ...X
  XX* XXXX* XXX..X
  X   XX    X X..X
 XX **XX  * X XXXX
 X     **** X     
 X * XXX    X     
 X   X XXXXXX     
 XXXXX            

*************************************
Maze: 37
File offset: 1E7F, DS:0AEF, table offset: 09F3
Size X: 21
Size Y: 15
End: 1ED0
Length: 82

XXXXXXXXXXX          
X......   XXXXXXXXX  
X......   X  XX   X  
X..XXX *    *     X  
X... * * X  XXX   X  
X...X*XXXXX    X  X  
XXX    X   X*  X *XXX
  X  ** * *  *XX  * X
  X  *   X*X  XX    X
  XXX XX X  * XXXXXXX
   X  * * XX XX      
   X    *  *  X      
   XX   X X   X      
    XXXXX@XXXXX      
        XXX          

*************************************
Maze: 38
File offset: 1ED1, DS:0B41, table offset: 0A45
Size X: 14
Size Y: 15
End: 1F11
Length: 65

 XXXXXXXXX    
 X....   XX   
 X.X.X  * XX  
XX....X X @XX 
X ....X  X  XX
X     X* XX* X
XX XXX  *    X
 X*  * * *X  X
 X X  * * XX X
 X  XXX  XX  X
 X    XX XX XX
 X  * X  *  X 
 XXX* *   XXX 
   X  XXXXX   
   XXXX       

*************************************
Maze: 39
File offset: 1F12, DS:0B82, table offset: 0A86
Size X: 23
Size Y: 18
End: 1F73
Length: 98

              XXX      
             XX.XXX    
             X....X    
 XXXXXXXXXXXXX....X    
XX   XX     XX....XXXXX
X  **XX  * @XX....    X
X      ** *X  ....X   X
X  * XX ** X X....X  XX
X  * XX *  X XX XXX  X 
XX XXXXX XXX         X 
XX   *  * XXXXX XXX  X 
X *XXX  X XXXXX X XXXX 
X   *   X       X      
X  * X* * *XXX  X      
X ***X *   X XXXX      
X    X  ** X           
XXXXXX   XXX           
     XXXXX             

*************************************
Maze: 40
File offset: 1F74, DS:0BE4, table offset: 0AE8
Size X: 11
Size Y: 11
End: 1F9A
Length: 39

      XXXX 
XXXXXXX @X 
X     *  X 
X   *XX *X 
XX*X...X X 
 X *...  X 
 X X. .X XX
 X   X X* X
 X*  *    X
 X  XXXXXXX
 XXXX      

*************************************
Maze: 41
File offset: 1F9B, DS:0C0B, table offset: 0B0F
Size X: 20
Size Y: 15
End: 1FDE
Length: 68

           XXXXX    
          XX   XX   
         XX     X   
        XX  **  X   
       XX **  * X   
       X *    * X   
XXXX   X   ** XXXXX 
X  XXXXXXXX XX    X 
X..           ***@X 
X.X XXXXXXX XX   XX 
X.X XXXXXXX. X* *XXX
X........... X   * X
XXXXXXXXXXXXXX  *  X
             XX  XXX
              XXXX  

*************************************
Maze: 42
File offset: 1FDF, DS:0C4F, table offset: 0B53
Size X: 13
Size Y: 18
End: 2022
Length: 68

 XXXXXXXX    
 X@XX   XXXX 
 X *   *   X 
 X  * * ***X 
 X **X X   X 
XX*    *   X 
X  *  *****XX
X *XXXX X   X
X  *....X   X
X XX....X** X
X XX....   XX
X   ....X  X 
XX X....X**X 
 X X....X  X 
 X         X 
 XXXX XX*XXX 
    X    X   
    XXXXXX   

*************************************
Maze: 43
File offset: 2023, DS:0C93, table offset: 0B97
Size X: 17
Size Y: 16
End: 206B
Length: 73

    XXXXXXXXXXXX 
    X          XX
    X  X X** *  X
    X* X*X  XX @X
   XX XX X * X XX
   X   * X*  X X 
   X   X *   X X 
   XX * *   XX X 
   X  X  XX  * X 
   X    XX **X X 
XXXXXX**   X   X 
X....X  XXXXXXXX 
X.X... XX        
X....   X        
X....   X        
XXXXXXXXX        

*************************************
Maze: 44
File offset: 206C, DS:0CDC, table offset: 0BE0
Size X: 25
Size Y: 19
End: 20DD
Length: 114

      XXXXXX             
   XXXXX   X             
   X   X X XXXXX         
   X * X  *    XXXXXX    
  XX*  XXX XX       X    
XXX  ** * * X  XX   XXXXX
X       *   XXXXXX XX   X
X  XXXXXXXX X@   X X  X X
XX XXX      XXXX X*X X  X
 X XXX XXXX XX.. X   * XX
 X  *  *  X*XX.. X*XX  XX
 X  X X X     ..XX XX * X
 XXXX   X XX X..X    *  X
    XXXXX    X..X X X  XX
        XXXXXX..X   X XX 
             X..XXXXX  X 
             X..       X 
             XX  XXX  XX 
              XXXXXXXXX  

*************************************
Maze: 45
File offset: 20DE, DS:0D4E, table offset: 0C52
Size X: 19
Size Y: 11
End: 2114
Length: 55

        XXXXXXX    
    XXXXX  X  XXXX 
    X   X   *    X 
 XXXX X** XX XX  X 
XX      X X  XX XXX
X  XXX *X*  *  *  X
X...    X XX  X   X
X...X    @ X XXX XX
X...X  XXX  *  *  X
XXXXXXXX XX   X   X
          XXXXXXXXX

*************************************
Maze: 46
File offset: 2115, DS:0D85, table offset: 0C89
Size X: 22
Size Y: 17
End: 2173
Length: 95

    XXXXXXXXX  XXXX   
    X   XX  XXXX  X   
    X   *   X  *  X   
    X  X XX X     XXXX
    XX *   * **X X   X
    XXXX  X  X * *   X
XXXXX  XXXX    XXX...X
X   X* X  X XXXX.....X
X      X  X X XX.....X
XXXXXX X  X*   XXX...X
   X   XX X *X   X...X
  XX       *  *X XXXXX
 XX ***XX  X *   X    
 X   X  X XXX  XXX    
 X   *  X* @XXXX      
 XXXXX  X   X         
     XXXXXXXX         

*************************************
Maze: 47
File offset: 2174, DS:0DE4, table offset: 0CE8
Size X: 19
Size Y: 15
End: 21B5
Length: 66

 XXXXX             
 X   X             
 X X XXXXXX        
 X      *@XXXXXX   
 X * XX* XXX   X   
 X XXXX *    * X   
 X XXXXX X  X* XXXX
XX  XXXX XX*      X
X  *X  *  X XX XX X
X         X X...X X
XXXXXX  XXX  ...  X
     XXXX X X...X X
          X XXX X X
          X       X
          XXXXXXXXX

*************************************
Maze: 48
File offset: 21B6, DS:0E26, table offset: 0D2A
Size X: 16
Size Y: 15
End: 21F4
Length: 63

       XXXX     
       X  XX    
       X   XX   
       X ** XX  
     XXX*  * XX 
  XXXX    *   X 
XXX  X XXXXX  X 
X    X X....* X 
X X   * ....X X 
X  * X X.&..X X 
XXX  XXXX XXX X 
  XXXX @*  XX*XX
     XXX *     X
       X  XX   X
       XXXXXXXXX

*************************************
Maze: 49
File offset: 21F5, DS:0E65, table offset: 0D69
Size X: 19
Size Y: 16
End: 224C
Length: 88

      XXXXXXXXXXXX 
     XX..    X   X 
    XX..& *    * X 
   XX..&.X X X* XX 
   X..&.X X X *  X 
XXXX...X  X    X X 
X  XX X          X 
X @* * XXX  X X XX 
X *   *   X X   X  
XXX**   X X X X X  
  X   *   X X XXXXX
  X *X XXXXX      X
  X*   X   X   X  X
  X  XXX   XX     X
  X  X      X    XX
  XXXX      XXXXXX 

*************************************
Maze: 50
File offset: 224D, DS:0EBD, table offset: 0DC1
Size X: 21
Size Y: 16
End: 22A7
Length: 91

     XXXXXXXXXXXXX   
     X    XXX    X   
     X     * *  XXXX 
   XXXX X   * *    X 
  XX *  X*XXXX * * X 
XXX   X X   XXX  * X 
X *  *  X  *  X XXXX 
X XX*XXXX X*X  *  XXX
X XX  XXX X X X  *  X
X    @*   *   X * X X
XXXXX  X  XX  X *X  X
  X... XXXXX*  X  X X
  X.......X ** X* X X
  X.......X         X
  X.......XXXXXXX  XX
  XXXXXXXXX     XXXX 

*************************************
Maze: 51
File offset: 22A8, DS:0F18, table offset: 0E1C
Size X: 16
Size Y: 14
End: 22EA
Length: 67

XXXXX XXXX      
X...X X  XXXX   
X...XXX  *  X   
X....XX *  *XXX 
XX....XX   *  X 
XXX... XX * * X 
X XX    X  *  X 
X  XX X XXX XXXX
X * X X*  *    X
X  * @ *    *  X
X   X * ** * XXX
X  XXXXXX  XXX  
X XX    XXXX    
XXX             

*************************************
Maze: 52
File offset: 22EB, DS:0F5B, table offset: 0E5F
Size X: 21
Size Y: 14
End: 2332
Length: 72

 XXXX                
XX  XXXXX            
X       X XXXXX      
X *XXX  XXX   X      
X..X  *X X  X X      
X..X      **X XXX    
X.&X X  X* *    XXXXX
X..X  XX     XX*X   X
X.&*  * X XX  *     X
X..XX  *   X   XXXXXX
X.&XX*XX   XXXXX     
X..  * XXXXX         
X  X @ X             
XXXXXXXX             

*************************************
Maze: 53
File offset: 2333, DS:0FA3, table offset: 0EA7
Size X: 13
Size Y: 19
End: 2382
Length: 80

   XXXXXXXXXX
   X  XXX   X
   X *   *  X
   X  XXXX*XX
   XX X  X  X
  XX  X.&   X
  X  XX..X  X
  X @ X.&X XX
  X X*X..X* X
  X * X..X  X
  X X X&&X  X
  X * X..X*XX
  X    .&X  X
 XXX  X  X  X
XX    XXXX  X
X  XXXXXXX*XX
X *      *  X
X  XX   X   X
XXXXXXXXXXXXX

*************************************
Maze: 54
File offset: 2383, DS:0FF3, table offset: 0EF7
Size X: 23
Size Y: 20
End: 23F8
Length: 118

 XXXXXXXXXXXXXXXXXXXXX 
 X   XX  X   X   X   X 
 X *     *   *   *   XX
XXXXX X  X   XXX XX*XXX
X   X XX*XXXXXX   X   X
X *   X ......X   X * X
XX X  X ......XXXXX   X
XX XXXXXXXXX..X   X XXX
X          X..X *   X  
X XX XXX XXX..XX X  XXX
X X   X   XX..XX XXX  X
X   @      *..X       X
X X   X   XX  X   XX  X
XXXXX XXXXXXXXXXXXXX XX
X          X   X    * X
X *  X * * *   X X    X
X X*XX *X  XX XX    X X
X  * ** XXXX *  * X X X
X          X   X      X
XXXXXXXXXXXXXXXXXXXXXXX

*************************************
Maze: 55
File offset: 23F9, DS:1069, table offset: 0F6D
Size X: 22
Size Y: 15
End: 2450
Length: 88

 XXXXXXXXXXXXXXXXXXXXX
XX                   X
X    * X      XX X   X
X  XXXXXX XXX  X*XX XX
XX*X   XX*X....   X X 
X  X    * X....XX X X 
X * X X X X....XX   X 
X * X**   X....XX*X X 
X X *@*XX*X....XX   X 
X   ***   X....X    X 
X  *X   X XXXXXX *XXX 
XX  X XXX**  *   * X  
XX     X *  * XX   X  
 XXXXX   X   XXXXXXX  
     XXXXXXXXX        

*************************************
Maze: 56
File offset: 2451, DS:10C1, table offset: 0FC5
Size X: 14
Size Y: 16
End: 248B
Length: 59

XXXXXXXXXX    
X        XXXX 
X XXXXXX X  XX
X X * * *  * X
X       X*   X
XXX*  **X  XXX
  X  XX X *XX 
  XX*X   * @X 
   X  * * XXX 
   X X   *  X 
   X XX   X X 
  XX  XXXXX X 
  X         X 
  X.......XXX 
  X.......X   
  XXXXXXXXX   

*************************************
Maze: 57
File offset: 248C, DS:10FC, table offset: 1000
Size X: 18
Size Y: 11
End: 24BD
Length: 50

         XXXX     
 XXXXXXXXX  XX    
XX  *      * XXXXX
X   XX XX   XX...X
X X** * **X*XX...X
X X    @  X   ...X
X  *X XXX**   ...X
X *  **  * XX....X
XXX*       XXXXXXX
  X  XXXXXXX      
  XXXX            

*************************************
Maze: 58
File offset: 24BE, DS:112E, table offset: 1032
Size X: 27
Size Y: 20
End: 2542
Length: 133

              XXXXXX       
          XXXXX    X       
          X  XX X  XXXXX   
          X   &.X..X   X   
 XXXXX XXXX *X.X...    X   
 X   XXX  XX X&....XX XX   
 X *      XX X..X..XX X    
XXXXXX X   X X&.XXXXX X    
X   X *X*X X X..XXXXX X    
X *  *     X X&.    X X    
XX XX  * XXX X  XX  X X    
 X  *  * XXX XXXXX XX X    
 XXX*XXX*XXX  XXXX XX X    
XXXX X         XXX  X X    
X  * X  *XXXX  XXX**X@XXXXX
X      * X X  XXXX  X*X   X
XXXX X  *X X              X
   X  *  X XX  XX  XXXXXXXX
   XX  XXX  XXXXXXXX       
    XXXX                   

*************************************
Maze: 59
File offset: 2543, DS:11B3, table offset: 10B7
Size X: 29
Size Y: 20
End: 25DA
Length: 152

         XXXX                
         X  X                
         X  XXXXXXXX         
   XXXXXXX  X      X         
   X   X X X X X   XX        
   X *     *  XX  * X        
  XXX *X X  X X     XXXXXXXXX
  X  *  X  *X X ** X   X X  X
 XX X   X     XXX    * X X  X
 X  X*   X XXX  X  X **X X  X
 X    *XX *  X   XX *  X X XX
XXXX* * X    XX  X   *    ..X
X  X    XXX X * * XXX  XXX.&X
X     XX  ** @  *     XX....X
X  XX  XX   *  X*X  XX....&.X
XX X  *  X X *XX  XX....&.XXX
XX XX  *  X * X  X....&.XXX  
X    * XXXX   X ....&.XXX    
X   X  X  X  X  ..&.XXX      
XXXXXXXX  XXXXXXXXXXX        

*************************************
Maze: 60
File offset: 25DB, DS:124B, table offset: 114F
Size X: 26
Size Y: 16
End: 2646
Length: 108

        XXXXX             
        X   XXXX          
        X *    XXXX  XXXX 
        X   X *X  XXXX  X 
XXXXXXXXXXX X   *   X   X 
X..     X *  XXXX X  X  X 
X..*  X   *  X  * X * .XX 
X.&X X * * XX  XX    X.X  
X..X* @ X   XX    ** X.X  
X..X * *  * * XX   XX .X  
X.&** X XX   * X*X * X.X  
X..X      XX   X     X.X  
X..XXXXXXX  XXX XXXXXX.XX 
X **                  &.XX
X  XXXXXXXXXXXXXXXXXX  ..X
XXXX                XXXXXX

*************************************
`;

// =============================================================================
// CONSTANTS
// =============================================================================
const BASE = { OUTSIDE: 0, FLOOR: 1, WALL: 2, GOAL: 3 };
const PANEL_W = 240;

// =============================================================================
// MAP PARSING
// =============================================================================
function parseMaps(text) {
    // Split on lines that consist ONLY of asterisks (the separator lines).
    // We cannot split on /\*{5,}/ because some puzzle grids contain 5+ consecutive
    // asterisk characters (boxes), which would incorrectly split mid-map.
    const allLines = text.replace(/\r/g, '').split('\n');
    const blocks = [];
    let current = [];
    for (const line of allLines) {
        if (/^\*{5,}\s*$/.test(line)) {
            if (current.length > 0) { blocks.push(current); current = []; }
        } else {
            current.push(line);
        }
    }
    if (current.length > 0) blocks.push(current);

    const maps = [];
    for (const blockLines of blocks) {
        const mazeIdx = blockLines.findIndex(l => /^Maze:\s*\d+/.test(l.trim()));
        if (mazeIdx === -1) continue;
        // Skip metadata lines until blank line
        let i = mazeIdx + 1;
        while (i < blockLines.length && blockLines[i].trim() !== '') i++;
        i++; // skip blank line
        // Collect grid lines until blank line or end
        const gridLines = [];
        while (i < blockLines.length) {
            if (blockLines[i].trim() === '' && gridLines.length > 0) break;
            gridLines.push(blockLines[i]);
            i++;
        }
        if (gridLines.length > 0) maps.push(parseGrid(gridLines));
    }
    return maps;
}

function parseGrid(rawLines) {
    while (rawLines.length > 0 && rawLines[rawLines.length - 1].trim() === '') rawLines.pop();
    const height = rawLines.length;
    const width = Math.max(...rawLines.map(l => l.length));
    const base = Array.from({ length: height }, () => new Array(width).fill(BASE.FLOOR));
    let startPX = 0, startPY = 0;
    const startBoxes = [];
    let goalCount = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const ch = rawLines[y][x] || ' ';
            switch (ch) {
                case 'X': base[y][x] = BASE.WALL; break;
                case '.': base[y][x] = BASE.GOAL; goalCount++; break;
                case '&':
                    // box already on a goal at puzzle start
                    base[y][x] = BASE.GOAL;
                    goalCount++;
                    startBoxes.push({ x, y });
                    break;
                case '*': startBoxes.push({ x, y }); break;
                case '@': startPX = x; startPY = y; break;
                // ' ' → FLOOR (default)
            }
        }
    }

    // Flood fill from border to mark exterior FLOOR cells as OUTSIDE
    function enqueue(x, y) {
        if (x >= 0 && x < width && y >= 0 && y < height && base[y][x] === BASE.FLOOR) {
            base[y][x] = BASE.OUTSIDE;
            queue.push([x, y]);
        }
    }
    const queue = [];
    for (let x = 0; x < width; x++) { enqueue(x, 0); enqueue(x, height - 1); }
    for (let y = 0; y < height; y++) { enqueue(0, y); enqueue(width - 1, y); }
    let head = 0;
    while (head < queue.length) {
        const [x, y] = queue[head++];
        enqueue(x + 1, y); enqueue(x - 1, y); enqueue(x, y + 1); enqueue(x, y - 1);
    }

    return { base, width, height, startPX, startPY, startBoxes, goalCount };
}

// =============================================================================
// GAME STATE
// =============================================================================
let maps = [];
const state = {
    mapIdx: 0,
    map: null,
    playerX: 0,
    playerY: 0,
    boxes: new Set(),   // "x,y" strings
    moves: 0,
    undoStack: [],
    won: false,
};

function bk(x, y) { return x + ',' + y; }

function loadLevel(idx) {
    state.mapIdx = idx;
    state.map = maps[idx];
    state.playerX = state.map.startPX;
    state.playerY = state.map.startPY;
    state.boxes = new Set(state.map.startBoxes.map(b => bk(b.x, b.y)));
    state.moves = 0;
    state.undoStack = [];
    state.won = false;
    document.getElementById('win-overlay').classList.add('hidden');
    document.getElementById('level-select').value = String(idx);
    updateUI();
    render();
}

function captureState() {
    return { px: state.playerX, py: state.playerY, boxes: new Set(state.boxes), moves: state.moves };
}

function tryMove(dx, dy) {
    if (state.won) return;
    const nx = state.playerX + dx;
    const ny = state.playerY + dy;
    const { base, width, height } = state.map;
    if (nx < 0 || nx >= width || ny < 0 || ny >= height) return;
    const target = base[ny][nx];
    if (target === BASE.WALL || target === BASE.OUTSIDE) return;

    const snap = captureState();

    if (state.boxes.has(bk(nx, ny))) {
        // Attempt to push box
        const bx = nx + dx, by = ny + dy;
        if (bx < 0 || bx >= width || by < 0 || by >= height) return;
        const behind = base[by][bx];
        if (behind === BASE.WALL || behind === BASE.OUTSIDE || state.boxes.has(bk(bx, by))) return;
        state.boxes.delete(bk(nx, ny));
        state.boxes.add(bk(bx, by));
    }

    state.playerX = nx;
    state.playerY = ny;
    state.moves++;
    state.undoStack.push(snap);

    updateUI();
    checkWin();
    render();
}

function undo() {
    if (state.undoStack.length === 0) return;
    const snap = state.undoStack.pop();
    state.playerX = snap.px;
    state.playerY = snap.py;
    state.boxes = snap.boxes;
    state.moves = snap.moves;
    state.won = false;
    document.getElementById('win-overlay').classList.add('hidden');
    updateUI();
    render();
}

function checkWin() {
    const { base } = state.map;
    for (const key of state.boxes) {
        const [x, y] = key.split(',').map(Number);
        if (base[y][x] !== BASE.GOAL) return;
    }
    // Also make sure box count == goal count (all goals covered)
    if (state.boxes.size !== state.map.goalCount) return;
    state.won = true;
    document.getElementById('win-overlay').classList.remove('hidden');
    document.getElementById('win-moves').textContent = 'Solved in ' + state.moves + ' moves';
    const nextBtn = document.getElementById('next-btn');
    nextBtn.style.display = state.mapIdx >= maps.length - 1 ? 'none' : '';
}

function updateUI() {
    document.getElementById('moves-display').textContent = state.moves;
}

// =============================================================================
// RENDERING
// =============================================================================
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Colour palette
const C = {
    outside:       '#0f172a',
    wall:          '#2d3d52',
    wallEdgeLight: '#3f5570',
    wallEdgeDark:  '#1a2535',
    floor:         '#e8eef5',
    floorAlt:      '#dde5ee',
    goalFill:      '#fef3c7',
    goalDot:       '#f59e0b',
    boxBody:       '#92400e',
    boxTop:        '#b45309',
    boxBorder:     '#78350f',
    boxOnGoalBody: '#064e3b',
    boxOnGoalTop:  '#065f46',
    boxOnGoalMark: '#6ee7b7',
    playerBody:    '#0c4a6e',
    playerTop:     '#0369a1',
    playerEye:     '#e0f2fe',
};

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
}

function render() {
    if (!state.map) return;
    const { base, width, height } = state.map;

    const pad = 24;
    const availW = canvas.width - PANEL_W - pad * 2;
    const availH = canvas.height - pad * 2;
    const cs = Math.max(8, Math.min(Math.floor(availW / width), Math.floor(availH / height)));

    const ox = PANEL_W + pad + Math.floor((availW - width * cs) / 2);
    const oy = pad + Math.floor((availH - height * cs) / 2);

    ctx.fillStyle = C.outside;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const px = ox + x * cs;
            const py = oy + y * cs;
            const cell = base[y][x];
            const isBox = state.boxes.has(bk(x, y));
            const isPlayer = x === state.playerX && y === state.playerY;
            const isGoal = cell === BASE.GOAL;
            drawCell(px, py, cs, cell, isBox, isPlayer, isGoal);
        }
    }
}

function drawCell(cx, cy, cs, cell, isBox, isPlayer, isGoal) {
    if (cell === BASE.OUTSIDE) return;

    if (cell === BASE.WALL) {
        drawWall(cx, cy, cs);
        return;
    }

    // Floor
    ctx.fillStyle = isGoal ? C.goalFill : C.floor;
    ctx.fillRect(cx, cy, cs, cs);

    if (isGoal && !isBox) drawGoalMarker(cx, cy, cs);
    if (isBox) drawBox(cx, cy, cs, isGoal);
    else if (isPlayer) drawPlayer(cx, cy, cs);
}

function drawWall(cx, cy, cs) {
    ctx.fillStyle = C.wall;
    ctx.fillRect(cx, cy, cs, cs);
    const e = Math.max(1, Math.round(cs * 0.07));
    // top highlight
    ctx.fillStyle = C.wallEdgeLight;
    ctx.fillRect(cx, cy, cs, e);
    ctx.fillRect(cx, cy, e, cs);
    // bottom shadow
    ctx.fillStyle = C.wallEdgeDark;
    ctx.fillRect(cx, cy + cs - e, cs, e);
    ctx.fillRect(cx + cs - e, cy, e, cs);
}

function drawGoalMarker(cx, cy, cs) {
    const r = Math.max(2, cs * 0.22);
    const mx = cx + cs / 2, my = cy + cs / 2;
    ctx.fillStyle = C.goalDot;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(mx, my - r);
    ctx.lineTo(mx + r, my);
    ctx.lineTo(mx, my + r);
    ctx.lineTo(mx - r, my);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
}

function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

function drawBox(cx, cy, cs, onGoal) {
    const pad = Math.max(1, Math.round(cs * 0.07));
    const bx = cx + pad, by = cy + pad;
    const bw = cs - pad * 2, bh = cs - pad * 2;
    const r = Math.max(1, Math.round(cs * 0.12));

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    roundRect(bx + 2, by + 3, bw, bh, r);
    ctx.fill();

    // Body
    ctx.fillStyle = onGoal ? C.boxOnGoalBody : C.boxBody;
    roundRect(bx, by, bw, bh, r);
    ctx.fill();

    // Top highlight strip
    const stripH = Math.max(2, Math.round(bh * 0.35));
    ctx.fillStyle = onGoal ? C.boxOnGoalTop : C.boxTop;
    roundRect(bx + 1, by + 1, bw - 2, stripH, r);
    ctx.fill();

    // Cross / H-brace lines
    const lw = Math.max(1, Math.round(cs * 0.05));
    ctx.strokeStyle = onGoal ? 'rgba(0,0,0,0.25)' : C.boxBorder;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(cx + cs / 2, cy + pad + 2);
    ctx.lineTo(cx + cs / 2, cy + cs - pad - 2);
    ctx.moveTo(cx + pad + 2, cy + cs * 0.55);
    ctx.lineTo(cx + cs - pad - 2, cy + cs * 0.55);
    ctx.stroke();

    if (onGoal) {
        // Checkmark
        const mx = cx + cs / 2, my = cy + cs / 2;
        const s = Math.max(3, cs * 0.18);
        ctx.strokeStyle = C.boxOnGoalMark;
        ctx.lineWidth = Math.max(1.5, cs * 0.09);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(mx - s, my);
        ctx.lineTo(mx - s * 0.2, my + s * 0.8);
        ctx.lineTo(mx + s, my - s * 0.7);
        ctx.stroke();
        ctx.lineCap = 'butt';
    }
}

function drawPlayer(cx, cy, cs) {
    const pad = Math.max(1, Math.round(cs * 0.1));
    const bx = cx + pad, by = cy + pad;
    const bw = cs - pad * 2, bh = cs - pad * 2;
    const r = Math.max(1, Math.round(cs * 0.18));

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    roundRect(bx + 2, by + 3, bw, bh, r);
    ctx.fill();

    // Body
    ctx.fillStyle = C.playerBody;
    roundRect(bx, by, bw, bh, r);
    ctx.fill();

    // Top highlight
    ctx.fillStyle = C.playerTop;
    roundRect(bx + 1, by + 1, bw - 2, Math.round(bh * 0.45), r);
    ctx.fill();

    // Eyes (two small dots)
    if (cs >= 14) {
        const ey = by + Math.round(bh * 0.38);
        const ex1 = bx + Math.round(bw * 0.3);
        const ex2 = bx + Math.round(bw * 0.7);
        const er = Math.max(1, Math.round(cs * 0.07));
        ctx.fillStyle = C.playerEye;
        ctx.beginPath();
        ctx.arc(ex1, ey, er, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex2, ey, er, 0, Math.PI * 2);
        ctx.fill();
    }
}

// =============================================================================
// EVENTS & INIT
// =============================================================================
window.addEventListener('resize', resize);

document.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':    case 'w': case 'W': e.preventDefault(); tryMove(0, -1); break;
        case 'ArrowDown':  case 's': case 'S': e.preventDefault(); tryMove(0,  1); break;
        case 'ArrowLeft':  case 'a': case 'A': e.preventDefault(); tryMove(-1, 0); break;
        case 'ArrowRight': case 'd': case 'D': e.preventDefault(); tryMove( 1, 0); break;
        case 'u': case 'U': undo(); break;
        case 'r': case 'R': if (confirm('Restart this level?')) loadLevel(state.mapIdx); break;
    }
});

document.getElementById('restart-btn').addEventListener('click', () => { if (confirm('Restart this level?')) loadLevel(state.mapIdx); });
document.getElementById('undo-btn').addEventListener('click', undo);
document.getElementById('next-btn').addEventListener('click', () => {
    if (state.mapIdx < maps.length - 1) loadLevel(state.mapIdx + 1);
});
document.getElementById('level-select').addEventListener('change', e => {
    const idx = parseInt(e.target.value, 10);
    if (confirm(`Switch to level ${idx + 1}?`)) {
        loadLevel(idx);
    } else {
        e.target.value = String(state.mapIdx);
    }
});

function init() {
    maps = parseMaps(MAPS_RAW);
    const sel = document.getElementById('level-select');
    for (let i = 0; i < maps.length; i++) {
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = 'Level ' + (i + 1);
        sel.appendChild(opt);
    }
    resize();
    loadLevel(0);
}

init();
