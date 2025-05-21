class Camera{
    constructor(){
        this.eye = new Vector3([0,0,3]);
        this.at = new Vector3([0,0,-100]);
        this.up = new Vector3([0,1,0]);
    }

    forward(){
        var atCopy  = new Vector3(this.at.elements);
        var eyeCopy = new Vector3(this.eye.elements);
        var f = atCopy.sub(eyeCopy);
        f = f.normalize();
        this.eye = this.eye.add(f);
        this.at  = this.at.add(f);
    }

    back(){
        var atCopy  = new Vector3(this.at.elements);
        var eyeCopy = new Vector3(this.eye.elements);        
        var f = atCopy.sub(eyeCopy);
        f = f.normalize();
        this.at  = this.at.sub(f);
        this.eye = this.eye.sub(f);
    }

    left(){
        var atCopy  = new Vector3(this.at.elements);
        var eyeCopy = new Vector3(this.eye.elements);
        var f = atCopy.sub(eyeCopy);

        f = f.normalize();
        f = f.mul(-1);
        var s = Vector3.cross(f, this.up);
        s = s.normalize();

        this.at  = this.at.add(s);
        this.eye = this.eye.add(s);
    }

    right(){
        var atCopy  = new Vector3(this.at.elements);
        var eyeCopy = new Vector3(this.eye.elements);
        var upCopy  = new Vector3(this.up.elements);
        var f = atCopy.sub(eyeCopy);

        f = f.normalize();
        var s = Vector3.cross(f, upCopy);
        s = s.normalize();
        this.at  = this.at.add(s);
        this.eye = this.eye.add(s);
    }

    panLeft(deg){
        var f = new Vector3([0,0,0]);
        f.set(this.at);
        f.sub(this.eye);
        var rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(deg, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        var f_prime = new Vector3([0,0,0]);
        f_prime = rotationMatrix.multiplyVector3(f);
        var tempEye = new Vector3([0,0,0]);
        tempEye.set(this.eye);
        this.at = tempEye.add(f_prime);
     }
  
     panRight(deg){
        var f = new Vector3([0,0,0]);
        f.set(this.at);
        f.sub(this.eye);
        var rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(deg, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        var f_prime = new Vector3([0,0,0]);
        f_prime = rotationMatrix.multiplyVector3(f);
        var tempEye = new Vector3([0,0,0]);
        tempEye.set(this.eye);
        this.at = tempEye.add(f_prime);
     }
}