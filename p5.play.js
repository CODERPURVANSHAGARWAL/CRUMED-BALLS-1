/*
p5.play
by Paolo Pedercini/molleindustria, 2015
http://molleindustria.org/
*/

(function(root, factory) {
if (typeof define === 'function' && define.amd)
define('p5.play', ['@code-dot-org/p5'], function(p5) { (factory(p5)); });
else if (typeof exports === 'object')
factory(require('@code-dot-org/p5'));
else
factory(root.p5);
}(this, function(p5) {
/**
 * p5.play is a library for p5.js to facilitate the creation of games and gamelike
 * projects.
 *
 * It provides a flexible Sprite class to manage visual objects in 2D space
 * and features such as animation support, basic collision detection
 * and resolution, mouse and keyboard interactions, and a virtual camera.
 *
 * p5.play is not a box2D-derived physics engine, it doesn't use events, and it's
 * designed to be understood and possibly modified by intermediate programmers.
 *
 * See the examples folder for more info on how to use this library.
 *
 * @module p5.play
 * @submodule p5.play
 * @for p5.play
 * @main 
  this.level 			= level || 0;
  this.bounds 		= bounds;

  this.objects 		= [];
  this.object_refs	= [];
  this.nodes 			= [];
}

Quadtree.prototype.updateBounds = function() {

  //find maximum area
  var objects = this.getAll();
  var x = 10000;
  var y = 10000;
  var w = -10000;
  var h = -10000;

  for( var i=0; i < objects.length; i++ )
    {
      if(objects[i].position.x < x)
        x = objects[i].position.x;
      if(objects[i].position.y < y)
        y = objects[i].position.y;
      if(objects[i].position.x > w)
        w = objects[i].position.x;
      if(objects[i].position.y > h)
        h = objects[i].position.y;
    }


  this.bounds = {
    x:x,
    y:y,
    width:w,
    height:h
  };
  //print(this.bounds);
};

/*
	 * Split the node into 4 subnodes
	 */
Quadtree.prototype.split = function() {

  var nextLevel	= this.level + 1,
      subWidth	= Math.round( this.bounds.width / 2 ),
      subHeight 	= Math.round( this.bounds.height / 2 ),
      x 			= Math.round( this.bounds.x ),
      y 			= Math.round( this.bounds.y );

  //top right node
  this.nodes[0] = new Quadtree({
    x	: x + subWidth,
    y	: y,
    width	: subWidth,
    height	: subHeight
  }, this.max_objects, this.max_levels, nextLevel);

  //top left node
  this.nodes[1] = new Quadtree({
    x	: x,
    y	: y,
    width	: subWidth,
    height	: subHeight
  }, this.max_objects, this.max_levels, nextLevel);

  //bottom left node
  this.nodes[2] = new Quadtree({
    x	: x,
    y	: y + subHeight,
    width	: subWidth,
    height	: subHeight
  }, this.max_objects, this.max_levels, nextLevel);

  //bottom right node
  this.nodes[3] = new Quadtree({
    x	: x + subWidth,
    y	: y + subHeight,
    width	: subWidth,
    height	: subHeight
  }, this.max_objects, this.max_levels, nextLevel);
};


/*
	 * Determine the quadtrant for an area in this node
	 */
Quadtree.prototype.getIndex = function( pRect ) {
  if(!pRect.collider)
    return -1;
  else
  {
    var colliderBounds = pRect.collider.getBoundingBox();
    var index 				= -1,
        verticalMidpoint 	= this.bounds.x + (this.bounds.width / 2),
        horizontalMidpoint 	= this.bounds.y + (this.bounds.height / 2),

        //pRect can completely fit within the top quadrants
        topQuadrant = (colliderBounds.top < horizontalMidpoint && colliderBounds.bottom < horizontalMidpoint),

        //pRect can completely fit within the bottom quadrants
        bottomQuadrant = (colliderBounds.top > horizontalMidpoint);

    //pRect can completely fit within the left quadrants
    if (colliderBounds.left < verticalMidpoint && colliderBounds.right < verticalMidpoint ) {
      if( topQuadrant ) {
        index = 1;
      } else if( bottomQuadrant ) {
        index = 2;
      }

      //pRect can completely fit within the right quadrants
    } else if( colliderBounds.left > verticalMidpoint ) {
      if( topQuadrant ) {
        index = 0;
      } else if( bottomQuadrant ) {
        index = 3;
      }
    }

    return index;
  }
};


/*
	 * Insert an object into the node. If the node
	 * exceeds the capacity, it will split and add all
	 * objects to their corresponding subnodes.
	 */
Quadtree.prototype.insert = function( obj ) {
  //avoid double insertion
  if(this.objects.indexOf(obj) === -1)
  {

    var i = 0,
        index;

    //if we have subnodes ...
    if( typeof this.nodes[0] !== 'undefined' ) {
      index = this.getIndex( obj );

      if( index !== -1 ) {
        this.nodes[index].insert( obj );
        return;
      }
    }

    this.objects.push( obj );

    if( this.objects.length > this.max_objects && this.level < this.max_levels ) {

      //split if we don't already have subnodes
      if( typeof this.nodes[0] === 'undefined' ) {
        this.split();
      }

      //add all objects to there corresponding subnodes
      while( i < this.objects.length ) {

        index = this.getIndex( this.objects[i] );

        if( index !== -1 ) {
          this.nodes[index].insert( this.objects.splice(i, 1)[0] );
        } else {
          i = i + 1;
        }
      }
    }
  }
};


/*
	 * Return all objects that could collide with a given area
	 */
Quadtree.prototype.retrieve = function( pRect ) {


  var index = this.getIndex( pRect ),
      returnObjects = this.objects;

  //if we have subnodes ...
  if( typeof this.nodes[0] !== 'undefined' ) {

    //if pRect fits into a subnode ..
    if( index !== -1 ) {
      returnObjects = returnObjects.concat( this.nodes[index].retrieve( pRect ) );

      //if pRect does not fit into a subnode, check it against all subnodes
    } else {
      for( var i=0; i < this.nodes.length; i=i+1 ) {
        returnObjects = returnObjects.concat( this.nodes[i].retrieve( pRect ) );
      }
    }
  }

  return returnObjects;
};

Quadtree.prototype.retrieveFromGroup = function( pRect, group ) {

  var results = [];
  var candidates = this.retrieve(pRect);

  for(var i=0; i<candidates.length; i++)
    if(group.contains(candidates[i]))
    results.push(candidates[i]);

  return results;
};

/*
	 * Get all objects stored in the quadtree
	 */
Quadtree.prototype.getAll = function() {

  var objects = this.objects;

  for( var i=0; i < this.nodes.length; i=i+1 ) {
    objects = objects.concat( this.nodes[i].getAll() );
  }

  return objects;
};


/*
	 * Get the node in which a certain object is stored
	 */
Quadtree.prototype.getObjectNode = function( obj ) {

  var index;

  //if there are no subnodes, object must be here
  if( !this.nodes.length ) {

    return this;

  } else {

    index = this.getIndex( obj );

    //if the object does not fit into a subnode, it must be here
    if( index === -1 ) {

      return this;

      //if it fits into a subnode, continue deeper search there
    } else {
      var node = this.nodes[index].getObjectNode( obj );
      if( node ) return node;
    }
  }

  return false;
};


/*
	 * Removes a specific object from the quadtree
	 * Does not delete empty subnodes. See cleanup-function
	 */
Quadtree.prototype.removeObject = function( obj ) {

  var node = this.getObjectNode( obj ),
      index = node.objects.indexOf( obj );

  if( index === -1 ) return false;

  node.objects.splice( index, 1);
};


/*
	 * Clear the quadtree and delete all objects
	 */
Quadtree.prototype.clear = function() {

  this.objects = [];

  if( !this.nodes.length ) return;

  for( var i=0; i < this.nodes.length; i=i+1 ) {

    this.nodes[i].clear();
  }

  this.nodes = [];
};


/*
	 * Clean up the quadtree
	 * Like clear, but objects won't be deleted but re-inserted
	 */
Quadtree.prototype.cleanup = function() {

  var objects = this.getAll();

  this.clear();

  for( var i=0; i < objects.length; i++ ) {
    this.insert( objects[i] );
  }
};



function updateTree() {
  if(this.quadTree.active)
  {
    this.quadTree.updateBounds();
    this.quadTree.cleanup();
  }
}

//keyboard input
p5.prototype.registerMethod('pre', p5.prototype.readPresses);

//automatic sprite update
p5.prototype.registerMethod('pre', p5.prototype.updateSprites);

//quadtree update
p5.prototype.registerMethod('post', updateTree);

//camera push and pop
p5.prototype.registerMethod('pre', cameraPush);
p5.prototype.registerMethod('post', cameraPop);

p5.prototype.registerPreloadMethod('loadImageElement', p5.prototype);

//deltaTime
//p5.prototype.registerMethod('pre', updateDelta);

/**
 * Log a warning message to the host console, using native `console.warn`
 * if it is available but falling back on `console.log` if not.  If no
 * console is available, this method will fail silently.
 * @method _warn
 * @param {!string} message
 * @private
 */
p5.prototype._warn = function(message) {
  var console = window.console;

  if(console)
  {
    if('function' === typeof console.warn)
    {
      console.warn(message);
    }
    else if('function' === typeof console.log)
    {
      console.log('Warning: ' + message);
    }
  }
};

  /**
   * Collision Shape Base Class
   *
   * We have a set of collision shapes available that all conform to
   * a simple interface so that they can be checked against one another
   * using the Separating Axis Theorem.
   *
   * This base class implements all the required methods for a collision
   * shape and can be used as a collision point with no changes.
   * Other shapes should inherit from this and override most methods.
   *
   * @class p5.CollisionShape
   * @constructor
   * @param {p5.Vector} [center] (zero if omitted)
   * @param {number} [rotation] (zero if omitted)
   */
  p5.CollisionShape = function(center, rotation) {
    /**
     * Transform of this shape relative to its parent.  If there is no parent,
     * this is pretty much the world-space transform.
     * This should stay consistent with _offset, _rotation and _scale properties.
     * @property _localTransform
     * @type {p5.Transform2D}
     * @protected
     */
    this._localTransform = new p5.Transform2D();
    if (rotation) {
      this._localTransform.rotate(rotation);
    }
    if (center) {
      this._localTransform.translate(center);
    }

    /**
     * Transform of whatever parent object (probably a sprite) this shape is
     * associated with.  If this is a free-floating shape, the parent transform
     * will remain an identity matrix.
     * @property _parentTransform
     * @type {p5.Transform2D}
     * @protected
     */
    this._parentTransform = new p5.Transform2D();

    /**
     * The center of the collision shape in world-space.
     * @property _center
     * @private
     * @type {p5.Vector}
     */
    this._center = new p5.Vector();

    /**
     * The center of the collision shape in local-space; also, the offset of the
     * collision shape's center from its parent sprite's center.
     * @property _offset
     * @type {p5.Vector}
     * @private
     */
    this._offset = new p5.Vector();

    /**
     * Rotation in radians in local space (relative to parent).
     * Note that this will only be meaningful for shapes that can rotate,
     * i.e. Oriented Bounding Boxes
     * @property _rotation
     * @private
     * @type {number}
     */
    this._rotation = 0;

    /**
     * Scale X and Y in local space.  Note that this will only be meaningful
     * for shapes that have dimensions (e.g. not for point colliders)
     * @property _scale
     * @type {p5.Vector}
     * @private
     */
    this._scale = new p5.Vector(1, 1);

    /**
     * If true, when calling `updateFromSprite` this collider will adopt the
     * base dimensions of the sprite in addition to adopting its transform.
     * If false, only the transform (position/rotation/scale) will be adopted.
     * @property getsDimensionsFromSprite
     * @type {boolean}
     */
    this.getsDimensionsFromSprite = false;

    // Public getters/setters
    Object.defineProperties(this, {

      /**
       * The center of the collision shape in world-space.
       * Note: You can set this property with a value in world-space, but it will
       * actually modify the collision shape's local transform.
       * @property center
       * @type {p5.Vector}
       */
      'center': {
        enumerable: true,
        get: function() {
          return this._center.copy();
        }.bind(this),
        set: function(c) {
          this._localTransform
            .translate(p5.Vector.mult(this._center, -1))
            .translate(c);
          this._onTransformChanged();
        }.bind(this)
      },

      /**
       * The center of the collision shape in local-space - if this collider is
       * owned by a sprite, the offset of the collider center from the sprite center.
       * @property offset
       * @type {p5.Vector}
       */
      'offset': {
        enumerable: true,
        get: function() {
          return this._offset.copy();
        }.bind(this),
        set: function(o) {
          this._localTransform
            .translate(p5.Vector.mult(this._offset, -1))
            .translate(o);
          this._onTransformChanged();
        }.bind(this)
      },

      /**
       * The local-space rotation of the collider, in radians.
       * @property rotation
       * @type {number}
       */
      'rotation': {
        enumerable: true,
        get: function() {
          return this._rotation;
        }.bind(this),
        set: function(r) {
          this._localTransform
            .clear()
            .scale(this._scale)
            .rotate(r)
            .translate(this._offset);
          this._onTransformChanged();
        }.bind(this)
      },

      /**
       * The local-space scale of the collider
       * @property scale
       * @type {p5.Vector}
       */
      'scale': {
        enumerable: true,
        get: function() {
          return this._scale.copy();
        }.bind(this),
        set: function(s) {
          this._localTransform
            .clear()
            .scale(s)
            .rotate(this._rotation)
            .translate(this._offset);
          this._onTransformChanged();
        }.bind(this)
      }
    });

    this._onTransformChanged();
  };

  /**
   * Update this collider based on the properties of a parent Sprite.
   * Descendant classes should override this method to adopt the dimensions
   * of the sprite if `getsDimensionsFromSprite` is true.
   * @method updateFromSprite
   * @param {Sprite} sprite
   * @see p5.CollisionShape.prototype.getsDimensionsFromSprite
   */
  p5.CollisionShape.prototype.updateFromSprite = function(sprite) {
    this.setParentTransform(sprite);
  };

  /**
   * Update this collider's parent transform, which will in turn adjust its
   * position, rotation and scale in world-space and recompute cached values
   * if necessary.
   * If a Sprite is passed as the 'parent' then a new transform will be computed
   * from the sprite's position/rotation/scale and used.
   * @method setParentTransform
   * @param {p5.Transform2D|Sprite} parent
   */
  p5.CollisionShape.prototype.setParentTransform = function(parent) {
    if (parent instanceof Sprite) {
      this._parentTransform
        .clear()
        .scale(parent._getScaleX(), parent._getScaleY())
        .rotate(radians(parent.rotation))
        .translate(parent.position);
    } else if (parent instanceof p5.Transform2D) {
      this._parentTransform = parent.copy();
    } else {
      throw new TypeError('Bad argument to setParentTransform: ' + parent);
    }
    this._onTransformChanged();
  };

  /**
   * Recalculate cached properties, relevant vectors, etc. when at least one
   * of the shape's transforms changes.  The base CollisionShape (and PointCollider)
   * only need to recompute the shape's center, but other shapes may need to
   * override this method and do additional recomputation.
   * @method _onTransformChanged
   * @protected
   */
  p5.CollisionShape.prototype._onTransformChanged = function() {
    // Recompute internal properties from transforms

    // Rotation in local space
    this._rotation = this._localTransform.getRotation();

    // Scale in local space
    this._scale = this._localTransform.getScale();

    // Offset in local-space
    this._offset
      .set(0, 0)
      .transform(this._localTransform);

    // Center in world-space
    this._center
      .set(this._offset.x, this._offset.y)
      .transform(this._parentTransform);
  };

  /**
   * Compute the smallest movement needed to move this collision shape out of
   * another collision shape.  If the shapes are not overlapping, returns a
   * zero vector to indicate that no displacement is necessary.
   * @method collide
   * @param {p5.CollisionShape} other
   * @return {p5.Vector}
   */
  p5.CollisionShape.prototype.collide = function(other) {
    var displacee = this, displacer = other;

    // Compute a displacement vector using the Separating Axis Theorem
    // (Valid only for convex shapes)
    //
    // If a line (axis) exists on which the two shapes' orthogonal projections
    // do not overlap, then the shapes do not overlap.  If the shapes'
    // projections do overlap on all candidate axes, the axis that had the
    // smallest overlap gives us the smallest possible displacement.
    //
    // @see http://www.dyn4j.org/2010/01/sat/
    var smallestOverlap = Infinity;
    var smallestOverlapAxis = null;

    // We speed things up with an additional assumption that all collision
    // shapes are centrosymmetric: Circles, ellipses, and rectangles
    // are OK.  This lets us only compare the shapes' radii to the
    // distance between their centers, even for non-circular shapes.
    // Other convex shapes, (triangles, pentagons) will require more
    // complex use of their projections' positions on the axis.
    var deltaOfCenters = p5.Vector.sub(displacer.center, displacee.center);

    // It turns out we only need to check a few axes, defined by the shapes
    // being checked.  For a polygon, the normal of each face is a possible
    // separating axis.
    var candidateAxes = p5.CollisionShape._getCandidateAxesForShapes(displacee, displacer);
    var axis, deltaOfCentersOnAxis, distanceOfCentersOnAxis;
    for (var i = 0; i < candidateAxes.length; i++) {
      axis = candidateAxes[i];

      // If distance between the shape's centers as projected onto the
      // separating axis is larger than the combined radii of the shapes
      // projected onto the axis, the shapes do not overlap on this axis.
      deltaOfCentersOnAxis = p5.Vector.project(deltaOfCenters, axis);
      distanceOfCentersOnAxis = deltaOfCentersOnAxis.mag();
      var r1 = displacee._getRadiusOnAxis(axis);
      var r2 = displacer._getRadiusOnAxis(axis);
      var overlap = r1 + r2 - distanceOfCentersOnAxis;
      if (overlap <= 0) {
        // These shapes are separated along this axis.
        // Early-out, returning a zero-vector displacement.
        return new p5.Vector();
      } else if (overlap < smallestOverlap) {
        // This is the smallest overlap we've found so far - store some
        // information about it, which we can use to give the smallest
        // displacement when we're done.
        smallestOverlap = overlap;
        // Normally use the delta of centers, which gives us direction along
        // with an axis.  In the rare case that the centers exactly overlap,
        // just use the original axis
        if (deltaOfCentersOnAxis.x === 0 && deltaOfCentersOnAxis.y === 0) {
          smallestOverlapAxis = axis;
        } else {
          smallestOverlapAxis = deltaOfCentersOnAxis;
        }
      }
    }

    // If we make it here, we overlap on all possible axes and we
    // can compute the smallest vector that will displace this out of other.
    return smallestOverlapAxis.copy().setMag(-smallestOverlap);
  };


  /**
   * Check whether this shape overlaps another.
   * @method overlap
   * @param {p5.CollisionShape} other
   * @return {boolean}
   */
  p5.CollisionShape.prototype.overlap = function(other) {
    var displacement = this.collide(other);
    return displacement.x !== 0 || displacement.y !== 0;
  };

  /**
   * @method _getCanididateAxesForShapes
   * @private
   * @static
   * @param {p5.CollisionShape} shape1
   * @param {p5.CollisionShape} shape2
   * @return {Array.<p5.Vector>}
   */
  p5.CollisionShape._getCandidateAxesForShapes = function(shape1, shape2) {
    var axes = shape1._getCandidateAxes(shape2)
      .concat(shape2._getCandidateAxes(shape1))
      .map(function(axis) {
        if (axis.x === 0 && axis.y === 0) {
          return p5.CollisionShape.X_AXIS;
        }
        return axis;
      });
    return deduplicateParallelVectors(axes);
  };

  /*
   * Reduce an array of vectors to a set of unique axes (that is, no two vectors
   * in the array should be parallel).
   * @param {Array.<p5.Vector>} array
   * @return {Array}
   */
  function deduplicateParallelVectors(array) {
    return array.filter(function(item, itemPos) {
      return !array.some(function(other, otherPos) {
        return itemPos < otherPos && item.isParallel(other);
      });
    });
  }

  /**
   * Compute candidate separating axes relative to another object.
   * Override this method in subclasses to implement collision behavior.
   * @method _getCandidateAxes
   * @protected
   * @return {Array.<p5.Vector>}
   */
  p5.CollisionShape.prototype._getCandidateAxes = function() {
    return [];
  };

  /**
   * Get this shape's radius (half-width of its projection) along the given axis.
   * Override this method in subclasses to implement collision behavior.
   * @method _getRadiusOnAxis
   * @protected
   * @param {p5.Vector} axis
   * @return {number}
   */
  p5.CollisionShape.prototype._getRadiusOnAxis = function() {
    return 0;
  };

  /**
   * Get the shape's minimum radius on any axis for tunneling checks.
   * @method _getMinRadius
   * @protected
   * @param {p5.Vector} axis
   * @return {number}
   */
  p5.CollisionShape.prototype._getMinRadius = function() {
    return 0;
  };

  /**
   * @property X_AXIS
   * @type {p5.Vector}
   * @static
   * @final
   */
  p5.CollisionShape.X_AXIS = new p5.Vector(1, 0);

  /**
   * @property Y_AXIS
   * @type {p5.Vector}
   * @static
   * @final
   */
  p5.CollisionShape.Y_AXIS = new p5.Vector(0, 1);

  /**
   * @property WORLD_AXES
   * @type {Array.<p5.Vector>}
   * @static
   * @final
   */
  p5.CollisionShape.WORLD_AXES = [
    p5.CollisionShape.X_AXIS,
    p5.CollisionShape.Y_AXIS
  ];

  /**
   * Get world-space axis-aligned bounds information for this collision shape.
   * Used primarily for the quadtree.
   * @method getBoundingBox
   * @return {{top: number, bottom: number, left: number, right: number, width: number, height: number}}
   */
  p5.CollisionShape.prototype.getBoundingBox = function() {
    var radiusOnX = this._getRadiusOnAxis(p5.CollisionShape.X_AXIS);
    var radiusOnY = this._getRadiusOnAxis(p5.CollisionShape.Y_AXIS);
    return {
      top: this.center.y - radiusOnY,
      bottom: this.center.y + radiusOnY,
      left: this.center.x - radiusOnX,
      right: this.center.x + radiusOnX,
      width: radiusOnX * 2,
      height: radiusOnY * 2
    };
  };

  /**
   * A point collision shape, used to detect overlap and displacement vectors
   * vs other collision shapes.
   * @class p5.PointCollider
   * @constructor
   * @extends p5.CollisionShape
   * @param {p5.Vector} center
   */
  p5.PointCollider = function(center) {
    p5.CollisionShape.call(this, center);
  };
  p5.PointCollider.prototype = Object.create(p5.CollisionShape.prototype);

  /**
   * Construct a new PointCollider with given offset for the given sprite.
   * @method createFromSprite
   * @static
   * @param {Sprite} sprite
   * @param {p5.Vector} [offset] from the sprite's center
   * @return {p5.PointCollider}
   */
  p5.PointCollider.createFromSprite = function(sprite, offset) {
    // Create the collision shape at the transformed offset
    var shape = new p5.PointCollider(offset);
    shape.setParentTransform(sprite);
    return shape;
  };

  /**
   * Debug-draw this point collider
   * @method draw
   * @param {p5} sketch instance to use for drawing
   */
  p5.PointCollider.prototype.draw = function(sketch) {
    sketch.push();
    sketch.rectMode(sketch.CENTER);
    sketch.translate(this.center.x, this.center.y);
    sketch.noStroke();
    sketch.fill(0, 255, 0);
    sketch.ellipse(0, 0, 2, 2);
    sketch.pop();
  };

  /**
   * A Circle collision shape, used to detect overlap and displacement vectors
   * with other collision shapes.
   * @class p5.CircleCollider
   * @constructor
   * @extends p5.CollisionShape
   * @param {p5.Vector} center
   * @param {number} radius
   */
  p5.CircleCollider = function(center, radius) {
    p5.CollisionShape.call(this, center);

    /**
     * The unscaled radius of the circle collider.
     * @property radius
     * @type {number}
     */
    this.radius = radius;

    /**
     * Final radius of this circle after being scaled by parent and local transforms,
     * cached so we don't recalculate it all the time.
     * @property _scaledRadius
     * @type {number}
     * @private
     */
    this._scaledRadius = 0;

    this._computeScaledRadius();
  };
  p5.CircleCollider.prototype = Object.create(p5.CollisionShape.prototype);

  /**
   * Construct a new CircleCollider with given offset for the given sprite.
   * @method createFromSprite
   * @static
   * @param {Sprite} sprite
   * @param {p5.Vector} [offset] from the sprite's center
   * @param {number} [radius]
   * @return {p5.CircleCollider}
   */
  p5.CircleCollider.createFromSprite = function(sprite, offset, radius) {
    var customSize = typeof radius === 'number';
    var shape = new p5.CircleCollider(
      offset,
      customSize ? radius : 1
    );
    shape.getsDimensionsFromSprite = !customSize;
    shape.updateFromSprite(sprite);
    return shape;
  };

  /**
   * Update this collider based on the properties of a parent Sprite.
   * @method updateFromSprite
   * @param {Sprite} sprite
   * @see p5.CollisionShape.prototype.getsDimensionsFromSprite
   */
  p5.CircleCollider.prototype.updateFromSprite = function(sprite) {
    if (this.getsDimensionsFromSprite) {
      if (sprite.animation) {
        this.radius = Math.max(sprite.animation.getWidth(), sprite.animation.getHeight())/2;
      } else {
        this.radius = Math.max(sprite.width, sprite.height)/2;
      }
    }
    this.setParentTransform(sprite);
  };

  /**
   * Recalculate cached properties, relevant vectors, etc. when at least one
   * of the shape's transforms changes.  The base CollisionShape (and PointCollider)
   * only need to recompute the shape's center, but other shapes may need to
   * override this method and do additional recomputation.
   * @method _onTransformChanged
   * @protected
   */
  p5.CircleCollider.prototype._onTransformChanged = function() {
    p5.CollisionShape.prototype._onTransformChanged.call(this);
    this._computeScaledRadius();
  };

  /**
   * Call to update the cached scaled radius value.
   * @method _computeScaledRadius
   * @private
   */
  p5.CircleCollider.prototype._computeScaledRadius = function() {
    this._scaledRadius = new p5.Vector(this.radius, 0)
      .transform(this._localTransform)
      .transform(this._parentTransform)
      .sub(this.center)
      .mag();
  };

  /**
   * Debug-draw this collision shape.
   * @method draw
   * @param {p5} sketch instance to use for drawing
   */
  p5.CircleCollider.prototype.draw = function(sketch) {
    sketch.push();
    sketch.noFill();
    sketch.stroke(0, 255, 0);
    sketch.rectMode(sketch.CENTER);
    sketch.ellipse(this.center.x, this.center.y, this._scaledRadius*2, this._scaledRadius*2);
    sketch.pop();
  };

    /**
   * Overrides CollisionShape.setParentTransform
   * Update this collider's parent transform, which will in turn adjust its
   * position, rotation and scale in world-space and recompute cached values
   * if necessary.
   * If a Sprite is passed as the 'parent' then a new transform will be computed
   * from the sprite's position/rotation/scale and used.
   * Use the max of the x and y scales values so the circle encompasses the sprite.
   * @method setParentTransform
   * @param {p5.Transform2D|Sprite} parent
   */
  p5.CircleCollider.prototype.setParentTransform = function(parent) {
    if (parent instanceof Sprite) {
      this._parentTransform
        .clear()
        .scale(Math.max(parent._getScaleX(), parent._getScaleY()))
        .rotate(radians(parent.rotation))
        .translate(parent.position);
    } else if (parent instanceof p5.Transform2D) {
      this._parentTransform = parent.copy();
    } else {
      throw new TypeError('Bad argument to setParentTransform: ' + parent);
    }
    this._onTransformChanged();
  };

  /**
   * Compute candidate separating axes relative to another object.
   * @method _getCandidateAxes
   * @protected
   * @param {p5.CollisionShape} other
   * @return {Array.<p5.Vector>}
   */
  p5.CircleCollider.prototype._getCandidateAxes = function(other) {
    // A circle has infinite potential candidate axes, so the ones we pick
    // depend on what we're colliding against.

    // TODO: If we can ask the other shape for a list of vertices, then we can
    //       generalize this algorithm by always using the closest one, and
    //       remove the special knowledge of OBB and AABB.

    if (other instanceof p5.OrientedBoundingBoxCollider || other instanceof p5.AxisAlignedBoundingBoxCollider) {
      // There are four possible separating axes with a box - one for each
      // of its vertices, through the center of the circle.
      // We need the closest one.
      var smallestSquareDistance = Infinity;
      var axisToClosestVertex = null;

      // Generate the set of vertices for the other shape
      var halfDiagonals = other.halfDiagonals;
      [
        p5.Vector.add(other.center, halfDiagonals[0]),
        p5.Vector.add(other.center, halfDiagonals[1]),
        p5.Vector.sub(other.center, halfDiagonals[0]),
        p5.Vector.sub(other.center, halfDiagonals[1])
      ].map(function(vertex) {
        // Transform each vertex into a vector from this collider center to
        // that vertex, which defines an axis we might want to check.
        return vertex.sub(this.center);
      }.bind(this)).forEach(function(vector) {
        // Figure out which vertex is closest and use its axis
        var squareDistance = vector.magSq();
        if (squareDistance < smallestSquareDistance) {
          smallestSquareDistance = squareDistance;
          axisToClosestVertex = vector;
        }
      });
      return [axisToClosestVertex];
    }

    // When checking against another circle or a point we only need to check the
    // axis through both shapes' centers.
    return [p5.Vector.sub(other.center, this.center)];
  };

  /**
   * Get this shape's radius (half-width of its projection) along the given axis.
   * @method _getRadiusOnAxis
   * @protected
   * @return {number}
   */
  p5.CircleCollider.prototype._getRadiusOnAxis = function() {
    return this._scaledRadius;
  };

  /**
   * Get the shape's minimum radius on any axis for tunneling checks.
   * @method _getMinRadius
   * @protected
   * @param {p5.Vector} axis
   * @return {number}
   */
  p5.CircleCollider.prototype._getMinRadius = function() {
    return this._scaledRadius;
  };

  /**
   * An Axis-Aligned Bounding Box (AABB) collision shape, used to detect overlap
   * and compute minimum displacement vectors with other collision shapes.
   *
   * Cannot be rotated - hence the name.  You might use this in place of an
   * OBB because it simplifies some of the math and may improve performance.
   *
   * @class p5.AxisAlignedBoundingBoxCollider
   * @constructor
   * @extends p5.CollisionShape
   * @param {p5.Vector} center
   * @param {number} width
   * @param {number} height
   */
  p5.AxisAlignedBoundingBoxCollider = function(center, width, height) {
    p5.CollisionShape.call(this, center);

    /**
     * Unscaled box width.
     * @property _width
     * @private
     * @type {number}
     */
    this._width = width;

    /**
     * Unscaled box height.
     * @property _width
     * @private
     * @type {number}
     */
    this._height = height;

    /**
     * Cached half-diagonals, used for computing a projected radius.
     * Already transformed into world-space.
     * @property _halfDiagonals
     * @private
     * @type {Array.<p5.Vector>}
     */
    this._halfDiagonals = [];

    Object.defineProperties(this, {

      /**
       * The untransformed width of the box collider.
       * Recomputes diagonals when set.
       * @property width
       * @type {number}
       */
      'width': {
        enumerable: true,
        get: function() {
          return this._width;
        }.bind(this),
        set: function(w) {
          this._width = w;
          this._halfDiagonals = this._computeHalfDiagonals();
        }.bind(this)
      },

      /**
       * The unrotated height of the box collider.
       * Recomputes diagonals when set.
       * @property height
       * @type {number}
       */
      'height': {
        enumerable: true,
        get: function() {
          return this._height;
        }.bind(this),
        set: function(h) {
          this._height = h;
          this._halfDiagonals = this._computeHalfDiagonals();
        }.bind(this)
      },

      /**
       * Two vectors representing adjacent half-diagonals of the box at its
       * current dimensions and orientation.
       * @property halfDiagonals
       * @readOnly
       * @type {Array.<p5.Vector>}
       */
      'halfDiagonals': {
        enumerable: true,
        get: function() {
          return this._halfDiagonals;
        }.bind(this)
      }
    });

    this._computeHalfDiagonals();
  };
  p5.AxisAlignedBoundingBoxCollider.prototype = Object.create(p5.CollisionShape.prototype);

  /**
   * Construct a new AxisAlignedBoundingBoxCollider with given offset for the given sprite.
   * @method createFromSprite
   * @static
   * @param {Sprite} sprite
   * @param {p5.Vector} [offset] from the sprite's center
   * @return {p5.CircleCollider}
   */
  p5.AxisAlignedBoundingBoxCollider.createFromSprite = function(sprite, offset, width, height) {
    var customSize = typeof width === 'number' && typeof height === 'number';
    var box = new p5.AxisAlignedBoundingBoxCollider(
      offset,
      customSize ? width : 1,
      customSize ? height : 1
    );
    box.getsDimensionsFromSprite = !customSize;
    box.updateFromSprite(sprite);
    return box;
  };

  /**
   * Update this collider based on the properties of a parent Sprite.
   * @method updateFromSprite
   * @param {Sprite} sprite
   * @see p5.CollisionShape.prototype.getsDimensionsFromSprite
   */
  p5.AxisAlignedBoundingBoxCollider.prototype.updateFromSprite = function(sprite) {
    if (this.getsDimensionsFromSprite) {
      if (sprite.animation) {
        this._width = sprite.animation.getWidth();
        this._height = sprite.animation.getHeight();
      } else {
        this._width = sprite.width;
        this._height = sprite.height;
      }
    }
    this.setParentTransform(sprite);
  };

  /**
   * Recalculate cached properties, relevant vectors, etc. when at least one
   * of the shape's transforms changes.  The base CollisionShape (and PointCollider)
   * only need to recompute the shape's center, but other shapes may need to
   * override this method and do additional recomputation.
   * @method _onTransformChanged
   * @protected
   */
  p5.AxisAlignedBoundingBoxCollider.prototype._onTransformChanged = function() {
    p5.CollisionShape.prototype._onTransformChanged.call(this);
    this._computeHalfDiagonals();
  };

  /**
   * Recompute this bounding box's half-diagonal vectors.
   * @method _computeHalfDiagonals
   * @private
   * @return {Array.<p5.Vector>}
   */
  p5.AxisAlignedBoundingBoxCollider.prototype._computeHalfDiagonals = function() {
    // We transform the rectangle (which may scale and rotate it) then compute
    // an axis-aligned bounding box _around_ it.
    var composedTransform = p5.Transform2D.mult(this._parentTransform, this._localTransform);
    var transformedDiagonals = [
      new p5.Vector(this._width / 2, -this._height / 2),
      new p5.Vector(this._width / 2, this._height / 2),
      new p5.Vector(-this._width / 2, this._height / 2)
    ].map(function(vertex) {
      return vertex.transform(composedTransform).sub(this.center);
    }.bind(this));

    var halfWidth = Math.max(
      Math.abs(transformedDiagonals[0].x),
      Math.abs(transformedDiagonals[1].x)
    );
    var halfHeight = Math.max(
      Math.abs(transformedDiagonals[1].y),
      Math.abs(transformedDiagonals[2].y)
    );

    this._halfDiagonals = [
      new p5.Vector(halfWidth, -halfHeight),
      new p5.Vector(halfWidth, halfHeight)
    ];
  };

  /**
   * Debug-draw this collider.
   * @method draw
   * @param {p5} sketch - p5 instance to use for drawing
   */
  p5.AxisAlignedBoundingBoxCollider.prototype.draw = function(sketch) {
    sketch.push();
    sketch.rectMode(sketch.CENTER);
    sketch.translate(this.center.x, this.center.y);
    sketch.noFill();
    sketch.stroke(0, 255, 0);
    sketch.strokeWeight(1);
    sketch.rect(0, 0, Math.abs(this._halfDiagonals[0].x) * 2, Math.abs(this._halfDiagonals[0].y) * 2);
    sketch.pop();
  };

  /**
   * Compute candidate separating axes relative to another object.
   * @method _getCandidateAxes
   * @protected
   * @return {Array.<p5.Vector>}
   */
  p5.AxisAlignedBoundingBoxCollider.prototype._getCandidateAxes = function() {
    return p5.CollisionShape.WORLD_AXES;
  };

  /**
   * Get this shape's radius (half-width of its projection) along the given axis.
   * @method _getRadiusOnAxis
   * @protected
   * @param {p5.Vector} axis
   * @return {number}
   */
  p5.AxisAlignedBoundingBoxCollider.prototype._getRadiusOnAxis = function(axis) {
    // How to project a rect onto an axis:
    // Project the center-corner vectors for two adjacent corners (cached here)
    // onto the axis.  The larger magnitude of the two is your projection's radius.
    return Math.max(
      p5.Vector.project(this._halfDiagonals[0], axis).mag(),
      p5.Vector.project(this._halfDiagonals[1], axis).mag());
  };

  /**
   * Get the shape's minimum radius on any axis for tunneling checks.
   * @method _getMinRadius
   * @protected
   * @param {p5.Vector} axis
   * @return {number}
   */
  p5.AxisAlignedBoundingBoxCollider.prototype._getMinRadius = function() {
    return Math.min(this._width, this._height);
  };

  /**
   * An Oriented Bounding Box (OBB) collision shape, used to detect overlap and
   * compute minimum displacement vectors with other collision shapes.
   * @class p5.OrientedBoundingBoxCollider
   * @constructor
   * @extends p5.CollisionShape
   * @param {p5.Vector} center of the rectangle in world-space
   * @param {number} width of the rectangle (when not rotated)
   * @param {number} height of the rectangle (when not rotated)
   * @param {number} rotation about center, in radians
   */
  p5.OrientedBoundingBoxCollider = function(center, width, height, rotation) {
    p5.CollisionShape.call(this, center, rotation);

    /**
     * Unscaled box width.
     * @property _width
     * @private
     * @type {number}
     */
    this._width = width;

    /**
     * Unscaled box height.
     * @property _width
     * @private
     * @type {number}
     */
    this._height = height;

    /**
     * Cached separating axes this shape contributes to a collision.
     * @property _potentialAxes
     * @private
     * @type {Array.<p5.Vector>}
     */
    this._potentialAxes = [];

    /**
     * Cached half-diagonals, used for computing a projected radius.
     * Already transformed into world-space.
     * @property _halfDiagonals
     * @private
     * @type {Array.<p5.Vector>}
     */
    this._halfDiagonals = [];

    Object.defineProperties(this, {

      /**
       * The unrotated width of the box collider.
       * Recomputes diagonals when set.
       * @property width
       * @type {number}
       */
      'width': {
        enumerable: true,
        get: function() {
          return this._width;
        }.bind(this),
        set: function(w) {
          this._width = w;
          this._onTransformChanged();
        }.bind(this)
      },

      /**
       * The unrotated height of the box collider.
       * Recomputes diagonals when set.
       * @property height
       * @type {number}
       */
      'height': {
        enumerable: true,
        get: function() {
          return this._height;
        }.bind(this),
        set: function(h) {
          this._height = h;
          this._onTransformChanged();
        }.bind(this)
      },

      /**
       * Two vectors representing adjacent half-diagonals of the box at its
       * current dimensions and orientation.
       * @property halfDiagonals
       * @readOnly
       * @type {Array.<p5.Vector>}
       */
      'halfDiagonals': {
        enumerable: true,
        get: function() {
          return this._halfDiagonals;
        }.bind(this)
      }
    });

    this._onTransformChanged();
  };
  p5.OrientedBoundingBoxCollider.prototype = Object.create(p5.CollisionShape.prototype);

  /**
   * Construct a new AxisAlignedBoundingBoxCollider with given offset for the given sprite.
   * @method createFromSprite
   * @static
   * @param {Sprite} sprite
   * @param {p5.Vector} [offset] from the sprite's center
   * @param {number} [width]
   * @param {number} [height]
   * @param {number} [rotation] in radians
   * @return {p5.CircleCollider}
   */
  p5.OrientedBoundingBoxCollider.createFromSprite = function(sprite, offset, width, height, rotation) {
    var customSize = typeof width === 'number' && typeof height === 'number';
    var box = new p5.OrientedBoundingBoxCollider(
      offset,
      customSize ? width : 1,
      customSize ? height : 1,
      rotation
    );
    box.getsDimensionsFromSprite = !customSize;
    box.updateFromSprite(sprite);
    return box;
  };

  /**
   * Update this collider based on the properties of a parent Sprite.
   * @method updateFromSprite
   * @param {Sprite} sprite
   * @see p5.CollisionShape.prototype.getsDimensionsFromSprite
   */
  p5.OrientedBoundingBoxCollider.prototype.updateFromSprite =
    p5.AxisAlignedBoundingBoxCollider.prototype.updateFromSprite;

  /**
   * Assuming this collider is a sprite's swept collider, update it based on
   * the properties of the parent sprite so that it encloses the sprite's
   * current position and its projected position.
   * @method updateSweptColliderFromSprite
   * @param {Sprite} sprite
   */
  p5.OrientedBoundingBoxCollider.prototype.updateSweptColliderFromSprite = function(sprite) {
    var vMagnitude = sprite.velocity.mag();
    var vPerpendicular = new p5.Vector(sprite.velocity.y, -sprite.velocity.x);
    this._width = vMagnitude + 2 * sprite.collider._getRadiusOnAxis(sprite.velocity);
    this._height = 2 * sprite.collider._getRadiusOnAxis(vPerpendicular);
    var newRotation = radians(sprite.getDirection());
    var newCenter = new p5.Vector(
      sprite.newPosition.x + 0.5 * sprite.velocity.x,
      sprite.newPosition.y + 0.5 * sprite.velocity.y
    );
    // Perform this.rotation = newRotation and this.center = newCenter;
    this._localTransform
      .clear()
      .scale(this._scale)
      .rotate(newRotation)
      .translate(this._offset)
      .translate(p5.Vector.mult(this._center, -1))
      .translate(newCenter);
    this._onTransformChanged();
  };

  /**
   * Recalculate cached properties, relevant vectors, etc. when at least one
   * of the shape's transforms changes.  The base CollisionShape (and PointCollider)
   * only need to recompute the shape's center, but other shapes may need to
   * override this method and do additional recomputation.
   * @method _onTransformChanged
   * @protected
   */
  p5.OrientedBoundingBoxCollider.prototype._onTransformChanged = function() {
    p5.CollisionShape.prototype._onTransformChanged.call(this);

    // Transform each vertex by the local and global matrices
    // then use their differences to determine width, height, and halfDiagonals
    var composedTransform = p5.Transform2D.mult(this._parentTransform, this._localTransform);
    var transformedVertices = [
      new p5.Vector(this._width / 2, -this._height / 2),
      new p5.Vector(this._width / 2, this._height / 2),
      new p5.Vector(-this._width / 2, this._height / 2)
    ].map(function(vertex) {
      return vertex.transform(composedTransform);
    });

    this._halfDiagonals = [
      p5.Vector.sub(transformedVertices[0], this.center),
      p5.Vector.sub(transformedVertices[1], this.center)
    ];

    this._potentialAxes = [
      p5.Vector.sub(transformedVertices[1], transformedVertices[2]),
      p5.Vector.sub(transformedVertices[1], transformedVertices[0])
    ];
  };

  /**
   * Debug-draw this collider.
   * @method draw
   * @param {p5} sketch - p5 instance to use for drawing
   */
  p5.OrientedBoundingBoxCollider.prototype.draw = function(sketch) {
    var composedTransform = p5.Transform2D.mult(this._localTransform, this._parentTransform);
    var scale = composedTransform.getScale();
    var rotation = composedTransform.getRotation();
    sketch.push();
    sketch.translate(this.center.x, this.center.y);
    sketch.scale(scale.x, scale.y);
    if (sketch._angleMode === sketch.RADIANS) {
      sketch.rotate(rotation);
    } else {
      sketch.rotate(degrees(rotation));
    }

    sketch.noFill();
    sketch.stroke(0, 255, 0);
    sketch.strokeWeight(1);
    sketch.rectMode(sketch.CENTER);
    sketch.rect(0, 0, this._width, this._height);
    sketch.pop();
  };

  /**
   * Compute candidate separating axes relative to another object.
   * @method _getCandidateAxes
   * @protected
   * @return {Array.<p5.Vector>}
   */
  p5.OrientedBoundingBoxCollider.prototype._getCandidateAxes = function() {
    // An oriented bounding box always provides two of its face normals,
    // which we've precomputed.
    return this._potentialAxes;
  };

  /**
   * Get this shape's radius (half-width of its projection) along the given axis.
   * @method _getRadiusOnAxis
   * @protected
   * @param {p5.Vector} axis
   * @return {number}
   */
  p5.OrientedBoundingBoxCollider.prototype._getRadiusOnAxis =
    p5.AxisAlignedBoundingBoxCollider.prototype._getRadiusOnAxis;
  // We can reuse the AABB version of this method because both are projecting
  // cached half-diagonals - the same code works.

  /**
   * When checking for tunneling through a OrientedBoundingBoxCollider use a
   * worst-case of zero (e.g. if the other sprite is passing through a corner).
   * @method _getMinRadius
   * @protected
   * @param {p5.Vector} axis
   * @return {number}
   */
  p5.OrientedBoundingBoxCollider.prototype._getMinRadius =
    p5.AxisAlignedBoundingBoxCollider.prototype._getMinRadius;

  /**
   * A 2D affine transformation (translation, rotation, scale) stored as a
   * 3x3 matrix that uses homogeneous coordinates.  Used to quickly transform
   * points or vectors between reference frames.
   * @class p5.Transform2D
   * @constructor
   * @extends Array
   * @param {p5.Transform2D|Array.<number>} [source]
   */
  p5.Transform2D = function(source) {
    // We only store the first six values.
    // the last row in a 2D transform matrix is always "0 0 1" so we can
    // save space and speed up certain calculations with this assumption.
    source = source || [1, 0, 0, 0, 1, 0];
    if (source.length !== 6) {
      throw new TypeError('Transform2D must have six components');
    }
    this.length = 6;
    this[0] = source[0];
    this[1] = source[1];
    this[2] = source[2];
    this[3] = source[3];
    this[4] = source[4];
    this[5] = source[5];
  };
  p5.Transform2D.prototype = Object.create(Array.prototype);

  /**
   * Reset this transform to an identity transform, in-place.
   * @method clear
   * @return {p5.Transform2D} this transform
   */
  p5.Transform2D.prototype.clear = function() {
    this[0] = 1;
    this[1] = 0;
    this[2] = 0;
    this[3] = 0;
    this[4] = 1;
    this[5] = 0;
    return this;
  };

  /**
   * Make a copy of this transform.
   * @method copy
   * @return {p5.Transform2D}
   */
  p5.Transform2D.prototype.copy = function() {
    return new p5.Transform2D(this);
  };

  /**
   * Check whether two transforms are the same.
   * @method equals
   * @param {p5.Transform2D|Array.<number>} other
   * @return {boolean}
   */
  p5.Transform2D.prototype.equals = function(other) {
    if (!(other instanceof p5.Transform2D || Array.isArray(other))) {
      return false; // Never equal to other types.
    }

    for (var i = 0; i < 6; i++) {
      if (this[i] !== other[i]) {
        return false;
      }
    }
    return true;
  };

  /**
   * Multiply two transforms together, combining them.
   * Does not modify original transforms.  Assigns result into dest argument if
   * provided and returns it.  Otherwise returns a new transform.
   * @method mult
   * @static
   * @param {p5.Transform2D|Array.<number>} t1
   * @param {p5.Transform2D|Array.<number>} t2
   * @param {p5.Transform2D} [dest]
   * @return {p5.Transform2D}
   */
  p5.Transform2D.mult = function(t1, t2, dest) {
    dest = dest || new p5.Transform2D();

    // Capture values of original matrices in local variables, in case one of
    // them is the one we're mutating.
    var t1_0, t1_1, t1_2, t1_3, t1_4, t1_5;
    t1_0 = t1[0];
    t1_1 = t1[1];
    t1_2 = t1[2];
    t1_3 = t1[3];
    t1_4 = t1[4];
    t1_5 = t1[5];

    var t2_0, t2_1, t2_2, t2_3, t2_4, t2_5;
    t2_0 = t2[0];
    t2_1 = t2[1];
    t2_2 = t2[2];
    t2_3 = t2[3];
    t2_4 = t2[4];
    t2_5 = t2[5];

    dest[0] = t1_0*t2_0 + t1_1*t2_3;
    dest[1] = t1_0*t2_1 + t1_1*t2_4;
    dest[2] = t1_0*t2_2 + t1_1*t2_5 + t1_2;

    dest[3] = t1_3*t2_0 + t1_4*t2_3;
    dest[4] = t1_3*t2_1 + t1_4*t2_4;
    dest[5] = t1_3*t2_2 + t1_4*t2_5 + t1_5;

    return dest;
  };

  /**
   * Multiply this transform by another, combining them.
   * Modifies this transform and returns it.
   * @method mult
   * @param {p5.Transform2D|Float32Array|Array.<number>} other
   * @return {p5.Transform2D}
   */
  p5.Transform2D.prototype.mult = function(other) {
    return p5.Transform2D.mult(this, other, this);
  };

  /**
   * Modify this transform, translating it by a certain amount.
   * Returns this transform.
   * @method translate
   * @return {p5.Transform2D}
   * @example
   *     // Two different ways to call this method.
   *     var t = new p5.Transform();
   *     // 1. Two numbers
   *     t.translate(x, y);
   *     // 2. One vector
   *     t.translate(new p5.Vector(x, y));
   */
  p5.Transform2D.prototype.translate = function(arg0, arg1) {
    var x, y;
    if (arg0 instanceof p5.Vector) {
      x = arg0.x;
      y = arg0.y;
    } else if (typeof arg0 === 'number' && typeof arg1 === 'number') {
      x = arg0;
      y = arg1;
    } else {
      var args = '';
      for (var i = 0; i < arguments.length; i++) {
        args += arguments[i] + ', ';
      }
      throw new TypeError('Invalid arguments to Transform2D.translate: ' + args);
    }
    return p5.Transform2D.mult([
      1, 0, x,
      0, 1, y
    ], this, this);
  };

  /**
   * Retrieve the resolved translation of this transform.
   * @method getTranslation
   * @return {p5.Vector}
   */
  p5.Transform2D.prototype.getTranslation = function() {
    return new p5.Vector(this[2], this[5]);
  };

  /**
   * Modify this transform, scaling it by a certain amount.
   * Returns this transform.
   * @method scale
   * @return {p5.Transform2D}
   * @example
   *     // Three different ways to call this method.
   *     var t = new p5.Transform();
   *     // 1. One scalar value
   *     t.scale(uniformScale);
   *     // 1. Two scalar values
   *     t.scale(scaleX, scaleY);
   *     // 2. One vector
   *     t.translate(new p5.Vector(scaleX, scaleY));
   */
  p5.Transform2D.prototype.scale = function(arg0, arg1) {
    var sx, sy;
    if (arg0 instanceof p5.Vector) {
      sx = arg0.x;
      sy = arg0.y;
    } else if (typeof arg0 === 'number' && typeof arg1 === 'number') {
      sx = arg0;
      sy = arg1;
    } else if (typeof arg0 === 'number') {
      sx = arg0;
      sy = arg0;
    } else {
      throw new TypeError('Invalid arguments to Transform2D.scale: ' + arguments);
    }
    return p5.Transform2D.mult([
      sx, 0, 0,
      0, sy, 0
    ], this, this);
  };

  /**
   * Retrieve the scale vector of this transform.
   * @method getScale
   * @return {p5.Vector}
   */
  p5.Transform2D.prototype.getScale = function() {
    var a = this[0], b = this[1],
        c = this[3], d = this[4];
    return new p5.Vector(
      sign(a) * Math.sqrt(a*a + b*b),
      sign(d) * Math.sqrt(c*c + d*d)
    );
  };

  /*
   * Return -1, 0, or 1 depending on whether a number is negative, zero, or positive.
   */
  function sign(x) {
    x = +x; // convert to a number
    if (x === 0 || isNaN(x)) {
      return Number(x);
    }
    return x > 0 ? 1 : -1;
  }

  /**
   * Modify this transform, rotating it by a certain amount.
   * @method rotate
   * @param {number} radians
   * @return {p5.Transform2D}
   */
  p5.Transform2D.prototype.rotate = function(radians) {
    // Clockwise!
    if (typeof radians !== 'number') {
      throw new TypeError('Invalid arguments to Transform2D.rotate: ' + arguments);
    }
    var sinR = Math.sin(radians);
    var cosR = Math.cos(radians);
    return p5.Transform2D.mult([
      cosR, -sinR, 0,
      sinR, cosR, 0
    ], this, this);
  };

  /**
   * Retrieve the angle of this transform in radians.
   * @method getRotation
   * @return {number}
   */
  p5.Transform2D.prototype.getRotation = function() {
    // see http://math.stackexchange.com/a/13165
    return Math.atan2(-this[1], this[0]);
  };

  /**
   * Applies a 2D transformation matrix (using homogeneous coordinates, so 3x3)
   * to a Vector2 (<x, y, 1>) and returns a new vector2.
   * @method transform
   * @for p5.Vector
   * @static
   * @param {p5.Vector} v
   * @param {p5.Transform2D} t
   * @return {p5.Vector} a new vector
   */
  p5.Vector.transform = function(v, t) {
    return v.copy().transform(t);
  };

  /**
   * Transforms this vector by a 2D transformation matrix.
   * @method transform
   * @for p5.Vector
   * @param {p5.Transform2D} transform
   * @return {p5.Vector} this, after the change
   */
  p5.Vector.prototype.transform = function(transform) {
    // Note: We cheat a whole bunch here since this is just 2D!
    // Use a different method if looking for true matrix multiplication.
    var x = this.x;
    var y = this.y;
    this.x = transform[0]*x + transform[1]*y + transform[2];
    this.y = transform[3]*x + transform[4]*y + transform[5];
    return this;
  };

}));
