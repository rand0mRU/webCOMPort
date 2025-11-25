void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
}

void loop() {
  // put your main code here, to run repeatedly:
  Serial.print(random(1024)); 
  Serial.print(", "); 
  Serial.print(random(1024)); 
  Serial.print(", "); 
  Serial.println(random(1024)); 
  delay(100);

  if (Serial.available() > 0) {
    Serial.println("Your message: " + Serial.readString());
  }
}